import sqlite3
from datetime import datetime

def initialize ():
    # This is setting up the Context Manager. This ensures that I wouldn't lose my database
    # if anything crashes.
    with sqlite3.connect('data/geisel_seats.db') as conn:
        # The cursor is like the pen (grabbing data) and the conn is the paper
        cursor = conn.cursor()
    # This is our code to build the table for the DB
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS floor_status (
            floor_id INTEGER PRIMARY KEY,
            floor_name TEXT NOT NULL,
            total_seats INTEGER NOT NULL,
            occupied_seats INTEGER DEFAULT 0,
            noise_level TEXT CHECK(noise_level IN ('Social', 'Quiet', 'Silent')),
            has_outlets BOOLEAN,
            last_updated DATETIME
        )
    ''')

    # Seed data this will the data for testing
    floors = [
        (1, '1st Floor (Social)', 200, 120, 'Social', 1, datetime.now()),
        (2, '2nd Floor (Main)', 300, 290, 'Social', 1, datetime.now()),
        (4, '4th Floor (Quiet)', 150, 45, 'Quiet', 1, datetime.now()),
        (8, '8th Floor (Silent)', 100, 98, 'Silent', 0, datetime.now())
    ] # INSERT OR IGNORE prevent us from running this more than 1 time and creating 
    # multiple tables
    cursor.executemany('INSERT OR IGNORE INTO floor_status VALUES (?,?,?,?,?,?,?)', floors)

# Execute the Database
if __name__ == "__main__":
    initialize()