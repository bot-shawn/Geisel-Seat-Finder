import sqlite3
import pandas as pd
import json
import os
from flask import Flask, jsonify, request  # Added 'request' here
from flask_cors import CORS
import threading

# TABLEAU EXPORT
def export():
    conn = sqlite3.connect('data/geisel_seats.db')
    df = pd.read_sql_query("SELECT * FROM floor_status", conn)
    df.to_csv('data/geisel_seats.csv', index=False)
    print('Data successfully exported into CSV (Tableau Updated)')
    conn.close()

# FLASK SERVER SETUP
app = Flask(__name__)
CORS(app)

latest_data = {"total": 0, "floors": {}}

@app.route('/seats', methods=['GET'])
def get_seats():
    return jsonify(latest_data)

@app.route('/checkin', methods=['POST'])
def check_in():
    data = request.json
    floor_name = data.get('floor')
    
    conn = sqlite3.connect('data/geisel_seats.db')
    cursor = conn.cursor()
    # Logic: Increment occupied seats by 1 if there's room
    cursor.execute("""
        UPDATE floor_status 
        SET occupied_seats = occupied_seats + 1 
        WHERE floor_name = ? AND occupied_seats < total_seats
    """, (floor_name,))
    conn.commit()
    conn.close()
    
    print(f"Someone checked into {floor_name}!")
    return jsonify({"status": "success"})

# SERVER THREADING
def run_server():
    # Use 0.0.0.0 so your phone can find your Mac on the Wi-Fi
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

threading.Thread(target=run_server, daemon=True).start()

# DATA BRIDGE
def update_app_data(total, floors):
    global latest_data
    latest_data = {"total": total, "floors": floors}
    # Optional: print("App data updated in memory!")

if __name__ == "__main__":
    # If you run this file directly, it just does one export
    export()