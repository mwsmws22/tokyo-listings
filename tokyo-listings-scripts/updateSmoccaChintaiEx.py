import psycopg2

theBit = 'no_like_list=true&recommend_type=base_at_like_list'

# enter DB connection info here
conn = psycopg2.connect(
    host="",
    port=0,
    database="",
    user="",
    password="")

cur = conn.cursor()

cur.execute("SELECT id, url FROM listings WHERE url LIKE \'%smocca%\' OR url LIKE \'%chintai-ex%\'")

res = cur.fetchall()
resSplit = []

for k, v in res:
    split = v.split("?")

    if len(split) > 2:
        print("split produced too many values")
        print(split)
    elif len(split) == 2:
        resSplit.append((k, split[0], split[1]))
    elif len(split) == 1:
        resSplit.append((k, split[0], ''))
    else:
        print("unknown issue")
        print(split)

filteredRes = [r for r in resSplit if r[2] != theBit]

print(len(filteredRes))

sortedRes = sorted(filteredRes, key=lambda x: x[1], reverse=True)

for r in sortedRes:
    betterUrl = r[1] + "?" + theBit
    sql = "UPDATE listings SET url = %s WHERE id = %s"
    cur.execute(sql, (betterUrl, r[0]))
    print(r[0])

conn.commit()
cur.close()
