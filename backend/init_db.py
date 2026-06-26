from app import app, db
from models import User

def init_database():
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully.")
        
        # Check if admin user exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            # Create default admin user
            admin = User(
                username='admin',
                email='admin@itrtracker.com',
                pin='1234'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created:")
            print("  Username: admin")
            print("  Password: admin123")
            print("  PIN: 1234")
        else:
            print("Admin user already exists.")
        
        print("\nDatabase initialization complete!")

if __name__ == '__main__':
    init_database()
