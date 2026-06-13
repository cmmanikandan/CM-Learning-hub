from app import create_app
from models import db
from sqlalchemy.schema import CreateTable

app = create_app()
with app.app_context():
    sql = ""
    for table in db.metadata.sorted_tables:
        sql += str(CreateTable(table).compile(db.engine)) + ";\n\n"
    
    with open('supabase_schema.sql', 'w') as f:
        f.write(sql)
    print("SQL dumped to supabase_schema.sql")
