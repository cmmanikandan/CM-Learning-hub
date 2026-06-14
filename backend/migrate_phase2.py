import os
import json
from flask import Flask
from models import db
from dotenv import load_dotenv

load_dotenv()

def run_migrations(uri, db_type):
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    print(f"\n--- Running Migrations for {db_type} ---")
    with app.app_context():
        # 1. Add file_url to chat_messages
        try:
            db.session.execute(db.text("ALTER TABLE chat_messages ADD COLUMN file_url VARCHAR(256);"))
            db.session.commit()
            print(f"{db_type}: Successfully added 'file_url' to chat_messages!")
        except Exception as e:
            db.session.rollback()
            print(f"{db_type}: 'file_url' might already exist or error: {e}")

        # 2. Add file_name to chat_messages
        try:
            db.session.execute(db.text("ALTER TABLE chat_messages ADD COLUMN file_name VARCHAR(256);"))
            db.session.commit()
            print(f"{db_type}: Successfully added 'file_name' to chat_messages!")
        except Exception as e:
            db.session.rollback()
            print(f"{db_type}: 'file_name' might already exist or error: {e}")

        # 3. Add bookmark_folders to users
        try:
            db.session.execute(db.text("ALTER TABLE users ADD COLUMN bookmark_folders TEXT;"))
            db.session.commit()
            print(f"{db_type}: Successfully added 'bookmark_folders' to users!")
        except Exception as e:
            db.session.rollback()
            print(f"{db_type}: 'bookmark_folders' might already exist or error: {e}")

        # 4. Make content column nullable in Postgres
        if db_type == "PostgreSQL":
            try:
                db.session.execute(db.text("ALTER TABLE chat_messages ALTER COLUMN content DROP NOT NULL;"))
                db.session.commit()
                print(f"{db_type}: Successfully set content column to DROP NOT NULL!")
            except Exception as e:
                db.session.rollback()
                print(f"{db_type}: Drop NOT NULL on content column failed: {e}")

    print(f"--- Finished Migrations for {db_type} ---\n")

if __name__ == "__main__":
    # Postgres
    pg_uri = os.getenv('DATABASE_URL')
    if pg_uri:
        try:
            run_migrations(pg_uri, "PostgreSQL")
        except Exception as e:
            print("Postgres Migration failed:", e)
    else:
        print("PostgreSQL DATABASE_URL not set in env.")
        
    # SQLite
    sqlite_uri = 'sqlite:///cm_learning_hub.db'
    try:
        run_migrations(sqlite_uri, "SQLite")
    except Exception as e:
        print("SQLite Migration failed:", e)
