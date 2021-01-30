# stdlib imports
import enum
import json
import os
import time
import typing

# vendor imports
import flask
import more_itertools
import requests
import werkzeug

# local imports
import stockhound_model as model

# Vars for IKEA CIA API
ciaClientId = os.environ.get("IKEA_CLIENT_ID", "")
ciaRoot = "https://api.ingka.ikea.com/cia/availabilities"


class ProductType(enum.Enum):
    ART = "ART"
    SPR = "SPR"


class StockLevel(enum.Enum):
    HIGH = "HIGH_IN_STOCK"
    MEDIUM = "MEDIUM_IN_STOCK"
    LOW = "LOW_IN_STOCK"
    NONE = "OUT_OF_STOCK"
    UNKNOWN = "?"  # Usually means not available at this location


def stockAvailable(level: StockLevel) -> bool:
    return level in [StockLevel.HIGH, StockLevel.MEDIUM, StockLevel.LOW]


stockLevelLabels = {
    StockLevel.HIGH: "High",
    StockLevel.MEDIUM: "Medium",
    StockLevel.LOW: "Low",
}


def api_response(payload, error, message, code, headers):
    """Construct an standard API response and and return it."""
    body = json.dumps({"payload": payload, "error": error, "message": message})
    headers["Content-Type"] = "application/json"
    return flask.make_response((body, code, headers))


def api_success(payload=None, message="", code=200, headers={}):
    """Return a successful API response."""
    return api_response(payload, False, message, code, headers)


def api_error(payload=None, message="", code=400, headers={}):
    """Return an API error response, and halt execution."""
    response = api_response(payload, True, message, code, headers)
    raise werkzeug.exceptions.HTTPException(response=response)


def validateProductId(
    countryCode: str, productId: str
) -> typing.Union[tuple[ProductType, str], tuple[None, None]]:
    # First, trim off any "S" that may be on the product code
    if productId.lower().startswith("s"):
        productId = productId[1:]

    # Request the product information from the API
    response = requests.get(
        f"{ciaRoot}/ru/{countryCode}",
        params={"itemNos": productId},
        headers={
            "accept": "application/json;version=2",
            "x-client-id": ciaClientId,
        },
    )

    # If there are any error codes, this means there's an internal problem
    # with Ikea's API
    if response.status_code != 200:
        print("Error querying CIA. Status code:", response.status_code)
        print(response.text)
        return (None, None)

    data = response.json()

    # If there's an error in the data, that means the product was not found
    if len(data.get("errors", [])) > 0 or len(data["availabilities"]) == 0:
        return (None, None)

    # Else, return the product ID and product type
    return (
        ProductType(data["availabilities"][0]["itemKey"]["itemType"]),
        productId,
    )


def getStockInfo(countryCode: str, productIds: list[str]):
    # Due to the limits of the API, we have to request in batches of no more
    # than 50 product IDs at once
    productStock = {pid: {} for pid in productIds}
    for i, chunk in enumerate(more_itertools.grouper(productIds, 50)):
        # If there is more than one chunk, sleep between the requests
        if i > 0:
            time.sleep(1)

        # Request the product availability from the API
        response = requests.get(
            f"{ciaRoot}/ru/{countryCode}",
            params={
                "itemNos": ",".join([e for e in chunk if e is not None]),
                "expand": "StoresList",
            },
            headers={
                "accept": "application/json;version=2",
                "x-client-id": ciaClientId,
            },
        )

        # Parse through the data and extract stock levels for each product
        for i, entry in enumerate(response.json().get("availabilities", [])):
            stockProductId = entry["itemKey"]["itemNo"]
            locationCode = entry["classUnitKey"]["classUnitCode"]
            if locationCode not in model.corpus[countryCode]["stores"]:
                continue
            try:
                level = entry["buyingOption"]["cashCarry"]["availability"][
                    "probability"
                ]["thisDay"]["messageType"]
                productStock[stockProductId][locationCode] = StockLevel(level)
            except KeyError:
                productStock[stockProductId][locationCode] = StockLevel.UNKNOWN

    return productStock
