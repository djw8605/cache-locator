import csv
import json

f = open('GlobalAirportDatabase.txt')

reader = csv.reader(f, delimiter=":")
parsed_db = open('parsed_database.txt', 'w')
to_write = []
keys = {}
for row in reader:
    if row[1] == "N/A":
        continue
    if row[1] in keys:
        print("Duplicate key: " + row[1])
        print("Original: " + str(keys[row[1]]))
        print("New:      " + str(row))
        if float(row[14]) == 0:
            continue
    
    keys[row[1]] = row

for airport, row in keys.items():
    row_write = {'key': row[1], 'value': str(row[14]) + "," + str(row[15])}
    to_write.append(row_write)

parsed_db.write(json.dumps(to_write))
parsed_db.close()
