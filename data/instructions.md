To get list of all countries/country codes:

1. Go to https://www.ikea.com

2. Open Chrome dev tools -> Sources tab -> right click "top" -> "Search in all files"

3. Search for `code:"US"` open the resulting file and pretty print the code (because it's minified)

4. Find the section of code where all of the sites are defined (as an array).

5. Done! You can copy this data structure into the console and JSONify it.

To get a list of stores for a country:

1. Visit the country's localized site, and browse to a product page. Any product will do.

2. Open Chrome dev tools -> Sources tab -> Ctrl + P -> look for a file named "range-stockcheck.[...].js"

3. Open this file, pretty print the code, and search for the data structure where the stores are defined (is usually preceded by `allStores =`).

4. Done! You can copy this data structure into the console and JSONify it.

_A maintained list of stores ready for import can be found [here](https://github.com/Ephigenia/ikea-availability-checker/blob/master/source/data/stores.json)_
