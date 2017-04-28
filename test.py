import enum
import json
import pathlib
import re
import requests
import xml.etree.ElementTree


with open(pathlib.Path.cwd() / 'store_names.json') as namesfile:
    store_names = json.load(namesfile)

def get_stock(store_no, product_no):
    url = f'http://www.ikea.com/us/en/iows/catalog/availability/{product_no}'
    response = requests.get(url)
    root = xml.etree.ElementTree.fromstring(response.text)
    for store in root.findall('.//localStore'):
        code = store.attrib['buCode']
        if code != store_no:
            continue
        return store.find('./stock/inStockProbabilityCode').text


print(get_stock('027', '50346424'))
