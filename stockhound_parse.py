"""
This is a tool that parses the IKEA global portal to populate the corpus.json
file with the data for all IKEA stores that Stock Hound supports.

Just invoke it in the project directory, and it'll write the data to the
proper file on its own.
"""
# stdlib imports
import json
import re

# vendor imports
import requests


# Initialize the master data structure
master = {}

# Fetch the source for the IKEA portal
root = 'https://www.ikea.com'
portalResp = requests.get(root)

# Capture the country JSON data from the ikea website
portalData = json.loads(re.search(
    r'_COUNTRYDATA = ({"Countries.*?}) \/\/ eslint',
    portalResp.text
).group(1))

# Iterate through the data structure
for country in portalData['Countries']:
    countryCode = country['country_code'].lower()

    # Figure out a default language
    languageCode = None
    for locale in country['locales']:
        if not re.match(
            r'https?:\/\/www\.ikea\.com\/\w{2}\/\w{2}\/',
            locale['url'],
        ):
            continue

        languageCode = locale['language_code'].lower()

        # Prefer english over other languages
        if locale['language_code'] == 'EN':
            break

    # If no language was determined, then this country is a bust
    if not languageCode:
        continue

    # Insert the country into the master data structure
    master[countryCode] = {
        'label': country['country_english'],
        'language': languageCode,
        'stores': {}
    }

# pprint.pprint(master)

# List of countries to drop from the structure
drop = []

# Iterate through each country and gather store data
for countryCode in master:
    print(f'Processing {countryCode}...')

    languageCode = master[countryCode]['language']

    # Load the localized A-Z catalog, and find the links to product series'
    catalogData = requests.get(
        f'{root}/{countryCode}/{languageCode}/catalog/productsaz'
    )
    seriesLinks = re.findall(
        r'productsAzLink.*href=".*?(\/\w{2}\/.*)"',
        catalogData.text
    )

    # If there isn't a catalog page there, it's incompatible with stock hound
    if not len(seriesLinks):
        drop.append(countryCode)
        continue

    for series in seriesLinks:
        # Load the series link and look for a product link
        seriesData = requests.get(
            f'{root}{series}'
        )
        productLink = re.search(
            r'catalog\/products\/S?\d{8,9}',
            seriesData.text
        )

        # If for some reason there wasn't a product link found,
        # go to next series
        if not productLink:
            continue

        # Fetch the product page, and parse out the store codes and names
        productData = requests.get(
            f'{root}/{countryCode}/{languageCode}/{productLink.group(0)}'
        )
        storeList = re.findall(
            r'<option value="(\d{3})">(.*?)<\/',
            productData.text
        )

        # If no stores found, continue to the next series
        if not len(storeList):
            continue

        # Iterate through the found stores
        dedupe = set()
        for storeCode, storeName in storeList:
            if storeCode not in dedupe:
                dedupe.add(storeCode)
                master[countryCode]['stores'][storeCode] = {
                    'label': storeName
                }

        # We can break this loop then
        break

# iterate through the drop list
for code in drop:
    del master[code]

# Dump to output file
print('Writing to corpus...')
json.dump(
    master,
    open('./data/corpus.json', 'w'),
    sort_keys=True,
    indent=4,
)
