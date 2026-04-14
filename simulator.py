import sqlite3
import time
import random
from export_data import export, update_app_data

def run_simulation():
    conn = sqlite3.connect('data/geisel_seats.db')
    cursor = conn.cursor()

    print("Geisel Seat Simulator Started...")
    print("Press Crtl+C to end")

    try:
        while True:
            # Get floor info using your actual column names
            cursor.execute("SELECT floor_id, floor_section, total_seats, occupied_seats, floor_name FROM floor_status")
            floors = cursor.fetchall()
            f_id, section, total, occupied, f_name = random.choice(floors)
            
            # Randomly change occupied seats
            change = random.choice([-1, 1])
            new_occupied = max(0, min(total, occupied + change))
            
            # Update the Database
            cursor.execute("UPDATE floor_status SET occupied_seats = ? WHERE floor_id = ? AND floor_section = ?", 
                           (new_occupied, f_id, section))
            conn.commit()

            # Calculate counts for the Mobile App
            cursor.execute("SELECT floor_name, SUM(total_seats - occupied_seats) FROM floor_status GROUP BY floor_name")
            rows = cursor.fetchall()
            
            current_floor_dict = {row[0]: row[1] for row in rows}
            current_total = sum(current_floor_dict.values())

            # Sync to Tableau and iPhone
            export() 
            update_app_data(current_total, current_floor_dict)

            print(f"Update: {f_name} ({section}) now has {total - new_occupied} seats free.")
            time.sleep(2)

    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        conn.close()

if __name__ == "__main__":
    run_simulation()