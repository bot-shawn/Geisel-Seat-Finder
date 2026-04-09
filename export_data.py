import sqlite3
import pandas as pd

# We want to export our data into a csv file so Tableau can read it
def export():
    conn = sqlite3.connect('data/geisel_seats.db')
    # This line will grab the whole table
    df = pd.read_sql_query("SELECT * FROM floor_status", conn)
    # This will save it as a csv
    df.to_csv('data/geisel_seats.csv', index = False)
    print('Data sucessfully exported into CSV')
    conn.close()

if __name__ == "__main__":
    export()