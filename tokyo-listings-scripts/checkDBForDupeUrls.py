import psycopg2


def strip(url):
    needOriginalUrls = [
        'realtokyoestate.co.jp',
        'tokyo-style.cc',
        'omusubi-estate.com',
        'tatodesign.jp',
        'joylifestyle.jp',
        'inet-tokyo.com'
    ]
    if not any(u in url for u in needOriginalUrls):
        return url.split("//")[1].split("?")[0]
    else:
        return url.split("//")[1]


def check_urls_stripped(results):
    dupes = set()

    for id_1, url_1 in results:
        for id_2, url_2 in results:
            if strip(url_1) in url_2:
                if id_1 < id_2:
                    dupes.add(((id_1, url_1), (id_2, url_2)))
                if id_1 > id_2:
                    dupes.add(((id_2, url_2), (id_1, url_1)))

    for d in dupes:
        print(str(d[0]))
        print(str(d[1]))
        print()


def main():
    # enter DB connection info here
    conn = psycopg2.connect(
        host="",
        port=0,
        database="",
        user="",
        password="")

    cur = conn.cursor()

    cur.execute("SELECT id, url FROM listings")

    results = cur.fetchall()

    check_urls_stripped(results)


main()
