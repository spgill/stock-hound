"""
Not quite ready for general use
"""
import json
import pathlib


masterList = json.load(pathlib.Path("./master-store-list.json").open("rb"))


namesFixes = {"ie": "Ireland"}


countries = {}
for entry in masterList:
    code = entry["code"].lower()

    data = {
        "label": namesFixes.get(code, entry["keywords"].split(",")[0]),
        "site": entry["siteName"],
        "stores": {},
    }

    localized = None
    for site in entry["localizedSites"]:
        if site["languageCode"].lower() == "en":
            localized = site
            break
    else:
        localized = entry["localizedSites"][0]

    data["language"] = localized["languageCode"].lower()
    data["url"] = localized["url"]

    countries[code] = data


storeList = json.load(pathlib.Path("./stores.json").open("rb"))

for entry in storeList:
    cc = entry["countryCode"].lower()
    bu = entry["buCode"].lower()
    if bu not in countries[cc]["stores"]:
        countries[cc]["stores"][bu] = {
            "label": entry["name"],
            "coord": entry.get("coordinates", None),
        }

print(countries)
purge = []

for countryCode in countries:
    if len(countries[countryCode]["stores"].keys()) == 0:
        purge.append(countryCode)

for code in purge:
    del countries[code]

json.dump(
    countries,
    pathlib.Path("./new-corpus.json").open("w"),
    indent=2,
    sort_keys=True,
)
