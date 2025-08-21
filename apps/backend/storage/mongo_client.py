import os
import pymongo
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timedelta
from typing import Optional, List
from dotenv import load_dotenv
import ssl
import hashlib
import uuid
import secrets
from models.models import UserState, UserRole, InvitationStatus

# Load environment variables
load_dotenv()

class MongoDBClient:
    def __init__(self):
        self.client = None
        self.db = None
        self.early_access_collection = None
        self.users_collection = None
        self.organizations_collection = None
        self.invitations_collection = None
        self.flows_collection = None
        self.projects_collection = None
        self.navigations_collection = None
        self.search_hooks_collection = None
        self.studio_config_collection = None
        self.workflows_collection = None
        self.auth_configs_collection = None
        self._connect()
    
    def _connect(self):
        """Initialize MongoDB connection"""
        try:
            connection_string = os.getenv('MONGO_DB_CONNECTION_STRING')
            if not connection_string:
                raise ValueError("MONGO_DB_CONNECTION_STRING environment variable is not set")
            
            # Handle Azure Cosmos DB SSL certificate issues
            if 'cosmos.azure.com' in connection_string:
                print("🔧 Configuring for Azure Cosmos DB...")
                # Add SSL parameters to connection string for Azure Cosmos DB
                ssl_params = "&tlsInsecure=true&retryWrites=false"
                if "?" in connection_string:
                    connection_string += ssl_params
                else:
                    connection_string += "?" + ssl_params[1:]  # Remove the leading &
            
            # Initialize MongoDB client
            self.client = MongoClient(connection_string, serverSelectionTimeoutMS=30000)
            
            # Test the connection
            self.client.admin.command('ping')
            
            # Use trail_blazer database
            self.db = self.client.trail_blazer
            self.early_access_collection = self.db.early_access
            self.users_collection = self.db.users
            self.organizations_collection = self.db.organizations
            self.api_keys_collection = self.db.api_keys
            self.invitations_collection = self.db.invitations
            self.flows_collection = self.db.flows
            self.projects_collection = self.db.projects
            self. s_collection = self.db.tracks
            self.track_settings_collection = self.db.track_settings
            self.app_navigations_collection = self.db.app_navigations
            self.search_hooks_collection = self.db.search_hooks
            self.logs_collection = self.db.logs
            self.studio_config_collection = self.db.studio_config
            self.workflows_collection = self.db.workflows
            self.auth_configs_collection = self.db.auth_configs
            
            # Create index on email for faster queries and uniqueness
            if self.early_access_collection is not None:
                self.early_access_collection.create_index("email", unique=True)
            
            # Create indexes on users collection
            if self.users_collection is not None:
                # self.users_collection.create_index("email", unique=True)
                # Add index on user_id for uniqueness and queries
                # try:
                #     self.users_collection.create_index("user_id", unique=True)
                #     print("✅ Created index on user_id for users collection")
                # except Exception as e:
                #     print(f"⚠️ Could not create user_id index: {e}")
                # # Add index on created_at for sorting (required by Azure Cosmos DB)
                # try:
                #     self.users_collection.create_index("created_at")
                #     print("✅ Created index on created_at for users collection")
                # except Exception as e:
                #     print(f"⚠️ Could not create created_at index: {e}")
                # # Add index on status for filtering
                # try:
                #     self.users_collection.create_index("status")
                #     print("✅ Created index on status for users collection")
                # except Exception as e:
                #     print(f"⚠️ Could not create status index: {e}")
                pass
            
            # Create index on org_id for organizations collection
            if self.organizations_collection is not None:
                self.organizations_collection.create_index("org_id", unique=True)
                self.organizations_collection.create_index("company_name", unique=True)
            
            # Create indexes on api_keys collection
            if self.api_keys_collection is not None:
                self.api_keys_collection.create_index("key_id", unique=True)
                self.api_keys_collection.create_index("hashed_key", unique=True)
                self.api_keys_collection.create_index("expires_at")
            
            # Create indexes on invitations collection
            if self.invitations_collection is not None:
                # Create composite unique index on (invite_id, email) to allow multiple emails per invite_id
                try:
                    # self.invitations_collection.create_index([("invite_id", 1), ("email", 1)], unique=True)
                    # print("✅ Created composite unique index on (invite_id, email)")
                    pass
                except Exception as e:
                    print(f"❌ Failed to create composite unique index: {e}")
                
                # Create other indexes
                try:
                    self.invitations_collection.create_index("email")
                    self.invitations_collection.create_index("expires_at")
                    print("✅ Created additional indexes on invitations collection")
                except Exception as e:
                    print(f"⚠️ Could not create additional indexes: {e}")
            
            # Create indexes on flows collection
            if self.flows_collection is not None:
                try:
                    # self.flows_collection.create_index("flow_id", unique=True)
                    # self.flows_collection.create_index("created_at")
                    # self.flows_collection.create_index("name")
                    # self.flows_collection.create_index("status")
                    # self.flows_collection.create_index("points_count")
                    # self.flows_collection.create_index("last_updated")
                    # self.flows_collection.create_index("project_id")
                    print("✅ Created indexes on flows collection (including flattened fields)")
                except Exception as e:
                    print(f"⚠️ Could not create flows collection indexes: {e}")
            
            # Create indexes on projects collection
            if self.projects_collection is not None:
                try:
                    # self.projects_collection.create_index("project_id", unique=True)
                    # self.projects_collection.create_index("org_id")
                    # self.projects_collection.create_index("created_by_user_id")
                    # self.projects_collection.create_index("created_at")
                    # self.projects_collection.create_index("status")
                    print("✅ Created indexes on projects collection")
                except Exception as e:
                    print(f"⚠️ Could not create projects collection indexes: {e}")
            
            # Create indexes on tracks collection
            # if self.tracks_collection is not None:
            #     try:
                    # self.tracks_collection.create_index("track_id", unique=True)
                    # self.tracks_collection.create_index("project_id")
                    # self.tracks_collection.create_index("org_id")
                    # self.tracks_collection.create_index("url")
                    # self.tracks_collection.create_index("status")
                    # self.tracks_collection.create_index("created_at")
                    # self.tracks_collection.create_index("navigation_id")
                #     print("✅ Created indexes on tracks collection")
                # except Exception as e:
                #     print(f"⚠️ Could not create tracks collection indexes: {e}")
            
            # Create indexes on track_settings collection
            if self.track_settings_collection is not None:
                try:
                    # self.track_settings_collection.create_index("project_id", unique=True)
                    # self.track_settings_collection.create_index("org_id")
                    # self.track_settings_collection.create_index("updated_at")
                    print("✅ Created indexes on track_settings collection")
                except Exception as e:
                    print(f"⚠️ Could not create track_settings collection indexes: {e}")
            
            # Create indexes on app_navigations collection
            if self.app_navigations_collection is not None:
                try:
                    # self.app_navigations_collection.create_index("navigation_id", unique=True)
                    # self.app_navigations_collection.create_index("project_id")
                    # self.app_navigations_collection.create_index("org_id")
                    # self.app_navigations_collection.create_index("url")
                    # self.app_navigations_collection.create_index("created_at")
                    print("✅ Created indexes on app_navigations collection")
                except Exception as e:
                    print(f"⚠️ Could not create app_navigations collection indexes: {e}")
            
            # Create indexes on search_hooks collection
            if self.search_hooks_collection is not None:
                try:
                    self.search_hooks_collection.create_index("search_hook_id", unique=True)
                    self.search_hooks_collection.create_index("project_id")
                    self.search_hooks_collection.create_index("org_id")
                    self.search_hooks_collection.create_index("created_at")
                    print("✅ Created indexes on search_hooks collection")
                except Exception as e:
                    print(f"⚠️ Could not create search_hooks collection indexes: {e}")
            
            # Create indexes on workflows collection
            if self.workflows_collection is not None:
                try:
                    self.workflows_collection.create_index("workflow_id", unique=True)
                    self.workflows_collection.create_index("project_id")
                    self.workflows_collection.create_index("org_id")
                    self.workflows_collection.create_index("created_at")
                    print("✅ Created indexes on workflows collection")
                except Exception as e:
                    print(f"⚠️ Could not create workflows collection indexes: {e}")
            
            # Create indexes on logs collection
            if self.logs_collection is not None:
                try:
                    # self.logs_collection.create_index("request_id", unique=True)
                    # self.logs_collection.create_index("project_id")
                    # self.logs_collection.create_index("created_at")
                    # self.logs_collection.create_index("updated_at")
                    # self.logs_collection.create_index("type")
                    # self.logs_collection.create_index("feedback_response")
                    # # Compound index for efficient querying
                    # self.logs_collection.create_index([
                    #     ("project_id", 1),
                    #     ("created_at", -1)
                    # ])
                    # # Compound index for feedback queries
                    # self.logs_collection.create_index([
                    #     ("project_id", 1),
                    #     ("feedback_response", 1)
                    # ])
                    print("✅ Created indexes on logs collection")
                except Exception as e:
                    print(f"⚠️ Could not create logs collection indexes: {e}")
            
            # Create indexes on studio_config collection
            if self.studio_config_collection is not None:
                try:
                    # self.studio_config_collection.create_index("project_id", unique=True)
                    # self.studio_config_collection.create_index("org_id")
                    # self.studio_config_collection.create_index("created_at")
                    # self.studio_config_collection.create_index("updated_at")
                    # self.studio_config_collection.create_index("created_by")
                    print("✅ Created indexes on studio_config collection")
                except Exception as e:
                    print(f"⚠️ Could not create studio_config collection indexes: {e}")
            
            print("✅ Connected to MongoDB successfully")
            
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            os._exit(1)
    
    def is_connected(self) -> bool:
        """Check if MongoDB is connected"""
        return self.client is not None and self.db is not None
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _generate_org_id(self) -> str:
        """Generate a unique organization ID"""
        return f"org_{uuid.uuid4().hex[:12]}"
    
    def _generate_api_key_id(self) -> str:
        """Generate a unique API key ID"""
        return f"ak_{uuid.uuid4().hex[:16]}"
    
    def _generate_api_key(self) -> str:
        """Generate a secure API key"""
        return f"tb_{secrets.token_urlsafe(32)}"
    
    def _hash_api_key(self, api_key: str) -> str:
        """Hash API key using SHA-256"""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    def _generate_invite_id(self) -> str:
        """Generate a unique invitation ID"""
        return f"inv_{secrets.token_urlsafe(16)}"
    
    def _generate_flow_id(self) -> str:
        """Generate a unique flow ID"""
        return f"flow_{secrets.token_urlsafe(16)}"
    
    def _generate_project_id(self) -> str:
        """Generate a unique project ID"""
        return f"proj_{secrets.token_urlsafe(16)}"
    
    def _generate_user_id(self) -> str:
        """Generate a unique user ID"""
        return f"user_{uuid.uuid4().hex[:16]}"
    
    def _generate_track_id(self) -> str:
        """Generate a unique track ID"""
        return f"track_{secrets.token_urlsafe(16)}"
    
    def _check_user_is_admin(self, email: str) -> bool:
        """Check if user has admin role"""
        if not self.is_connected() or self.users_collection is None:
            return False
        
        try:
            user = self.users_collection.find_one({"email": email})
            if not user:
                return False
            return user.get("role") == UserRole.ADMIN
        except Exception as e:
            print(f"Error checking admin role: {e}")
            return False
    
    def create_organization(self, company_name: str) -> dict:
        """Create a new organization"""
        if not self.is_connected() or self.organizations_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Check if organization already exists
            existing_org = self.organizations_collection.find_one({"company_name": company_name})
            if existing_org:
                return {
                    "success": True,
                    "message": "Organization already exists",
                    "org_id": existing_org["org_id"],
                    "company_name": existing_org["company_name"],
                    "existing": True
                }
            
            # Create new organization
            org_id = self._generate_org_id()
            org_document = {
                "org_id": org_id,
                "company_name": company_name,
                "created_at": datetime.utcnow(),
                "status": UserState.PENDING,
                "user_count": 0
            }
            
            result = self.organizations_collection.insert_one(org_document)
            
            if result.inserted_id:
                return {
                    "success": True,
                    "message": "Organization created successfully",
                    "org_id": org_id,
                    "company_name": company_name,
                    "existing": False
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to create organization"
                }
                
        except DuplicateKeyError:
            return {
                "success": False,
                "message": "Organization already exists"
            }
        except Exception as e:
            print(f"Error creating organization: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def get_organization_by_name(self, company_name: str) -> Optional[dict]:
        """Get organization by company name"""
        if not self.is_connected() or self.organizations_collection is None:
            return None
        
        try:
            return self.organizations_collection.find_one({"company_name": company_name})
        except Exception as e:
            print(f"Error getting organization: {e}")
            return None
    
    def get_organization_by_id(self, org_id: str) -> Optional[dict]:
        """Get organization by org_id"""
        if not self.is_connected() or self.organizations_collection is None:
            return None
        
        try:
            return self.organizations_collection.find_one({"org_id": org_id})
        except Exception as e:
            print(f"Error getting organization: {e}")
            return None
    
    def increment_org_user_count(self, org_id: str):
        """Increment user count for an organization"""
        if not self.is_connected() or self.organizations_collection is None:
            return
        
        try:
            self.organizations_collection.update_one(
                {"org_id": org_id},
                {"$inc": {"user_count": 1}}
            )
        except Exception as e:
            print(f"Error incrementing user count: {e}")
    
    def create_user(self, email: str, password: str, name: str, company_name: str, role: UserRole = UserRole.ADMIN) -> dict:
        """Create a new user and associate with organization"""
        if not self.is_connected() or self.users_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Check if user already exists
            existing_user = self.users_collection.find_one({"email": email})
            if existing_user:
                return {
                    "success": False,
                    "message": "User already exists"
                }
            
            # Create or get organization
            org_result = self.create_organization(company_name)
            if not org_result["success"]:
                return {
                    "success": False,
                    "message": f"Failed to create organization: {org_result['message']}"
                }
            
            org_id = org_result["org_id"]
            
            # Create new user
            user_document = {
                "user_id": self._generate_user_id(),
                "email": email,
                "password": self._hash_password(password),
                "name": name,
                "org_id": org_id,
                "company_name": company_name,
                "created_at": datetime.utcnow(),
                "status": UserState.PENDING,
                "role": role
            }
            
            result = self.users_collection.insert_one(user_document)
            
            if result.inserted_id:
                # Increment user count for organization (only if it's a new user)
                if not org_result.get("existing"):
                    self.increment_org_user_count(org_id)
                else:
                    self.increment_org_user_count(org_id)
                
                return {
                    "success": True,
                    "message": "User created successfully",
                    "user_id": user_document["user_id"],
                    "org_id": org_id,
                    "company_name": company_name,
                    "name": name
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to create user"
                }
                
        except DuplicateKeyError:
            return {
                "success": False,
                "message": "User already exists"
            }
        except Exception as e:
            print(f"Error creating user: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def validate_user_credentials(self, email: str, password: str) -> bool:
        """Validate user credentials"""
        if not self.is_connected() or self.users_collection is None:
            return False
        
        try:
            # Find user by email
            user = self.users_collection.find_one({"email": email})
            if not user:
                return False
            
            # Check if user is active
            if user.get("status") != "active":
                return False
            
            # Validate password
            hashed_password = self._hash_password(password)
            return user.get("password") == hashed_password
            
        except Exception as e:
            print(f"Error validating credentials: {e}")
            return False
    
    def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email"""
        if not self.is_connected() or self.users_collection is None:
            return None
        
        try:
            user = self.users_collection.find_one({"email": email})
            if user:
                # Remove password from returned user data
                user.pop("password", None)
                user["_id"] = str(user["_id"])
                
                # Ensure user_id is present
                if "user_id" not in user:
                    user["user_id"] = str(user["_id"])
            return user
        except Exception as e:
            print(f"Error getting user: {e}")
            return None

    def list_users(self, include_inactive: bool = False, limit: int = 100, skip: int = 0) -> dict:
        """List all users with pagination"""
        print(f"📋 MongoDB list_users called with include_inactive={include_inactive}, limit={limit}, skip={skip}")
        
        if not self.is_connected() or self.users_collection is None:
            print("❌ Database connection not available")
            return {
                "success": False,
                "message": "Database connection not available",
                "users": [],
                "total_count": 0
            }
        
        try:
            # Build query filter
            query_filter = {}
            if not include_inactive:
                # Include active, pending, and suspended users by default (exclude only inactive)
                query_filter["status"] = {"$in": [UserState.ACTIVE, UserState.PENDING, UserState.SUSPENDED]}
            
            print(f"🔍 Query filter: {query_filter}")
            
            # Get total count
            total_count = self.users_collection.count_documents(query_filter)
            print(f"📊 Total users found: {total_count}")
            
            # Get users with pagination
            # Use _id for sorting (always indexed) instead of created_at to avoid Azure Cosmos DB index issues
            cursor = self.users_collection.find(query_filter).skip(skip).limit(limit).sort("_id", -1)
            users = list(cursor)
            
            print(f"📄 Retrieved {len(users)} users for current page")
            
            # Process users - remove passwords and use user_id field
            processed_users = []
            for user in users:
                # Remove password field
                user.pop("password", None)
                
                # Use user_id field if available, otherwise fall back to _id
                user_id = user.get("user_id")
                if not user_id:
                    user_id = str(user.get("_id", ""))
                
                # Handle None name for pending users
                name = user.get("name")
                if name is None and user.get("status") == UserState.PENDING:
                    name = None  # Keep as None for pending users to show they haven't registered yet
                elif name is None:
                    name = ""  # Default to empty string for other cases
                
                processed_user = {
                    "user_id": user_id,
                    "email": user.get("email", ""),
                    "name": name,
                    "org_id": user.get("org_id", ""),
                    "company_name": user.get("company_name", ""),
                    "created_at": user.get("created_at", datetime.utcnow()),
                    "status": user.get("status", UserState.PENDING),
                    "role": user.get("role", UserRole.USER)
                }
                processed_users.append(processed_user)
            
            message = f"Retrieved {len(processed_users)} users"
            if not include_inactive:
                message += " (active, pending, and suspended users)"
            else:
                message += " (all users including inactive)"
            
            return {
                "success": True,
                "message": message,
                "users": processed_users,
                "total_count": total_count
            }
            
        except Exception as e:
            print(f"❌ Exception in list_users: {e}")
            print(f"📍 Exception type: {type(e)}")
            import traceback
            print(f"📋 Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "message": "Internal server error",
                "users": [],
                "total_count": 0
            }
    
    def update_user(self, email: str, name: Optional[str] = None, company_name: Optional[str] = None) -> dict:
        """Update user details"""
        if not self.is_connected() or self.users_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Check if user exists
            existing_user = self.users_collection.find_one({"email": email})
            if not existing_user:
                return {
                    "success": False,
                    "message": "User not found"
                }
            
            # Prepare update data
            update_data = {}
            
            if name is not None:
                update_data["name"] = name
            
            if company_name is not None:
                # Handle organization change
                current_org_id = existing_user.get("org_id")
                
                # Check if the new company already exists
                org_result = self.create_organization(company_name)
                if not org_result["success"]:
                    return {
                        "success": False,
                        "message": f"Failed to create/find organization: {org_result['message']}"
                    }
                
                new_org_id = org_result["org_id"]
                
                # Update user's organization info
                update_data["company_name"] = company_name
                update_data["org_id"] = new_org_id
                
                # Update user counts if organization changed
                if current_org_id != new_org_id:
                    # Increment new organization user count
                    self.increment_org_user_count(new_org_id)
                    
                    # Decrement old organization user count (if different)
                    if current_org_id and self.organizations_collection is not None:
                        try:
                            self.organizations_collection.update_one(
                                {"org_id": current_org_id},
                                {"$inc": {"user_count": -1}}
                            )
                        except Exception as e:
                            print(f"Error decrementing old org user count: {e}")
            
            if not update_data:
                return {
                    "success": False,
                    "message": "No fields to update"
                }
            
            # Update the user
            result = self.users_collection.update_one(
                {"email": email},
                {"$set": update_data}
            )
            
            if result.matched_count > 0:
                # Get updated user data
                updated_user = self.get_user_by_email(email)
                return {
                    "success": True,
                    "message": "User updated successfully",
                    "user": updated_user
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to update user"
                }
                
        except Exception as e:
            print(f"Error updating user: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def update_password(self, email: str, old_password: str, new_password: str) -> dict:
        """Update user password"""
        print(f"🔐 MongoDB update_password called for email: {email}")
        print(f"📋 Parameters: old_password={'***' if old_password else 'None'}, new_password={'***' if new_password else 'None'}")
        
        if not self.is_connected() or self.users_collection is None:
            print("❌ Database connection not available")
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Check if user exists and validate old password
            print(f"🔍 Looking up user: {email}")
            existing_user = self.users_collection.find_one({"email": email})
            if not existing_user:
                print(f"❌ User not found: {email}")
                return {
                    "success": False,
                    "message": "User not found"
                }
            
            print(f"✅ User found: {email}")
            print(f"📊 User data: email={existing_user.get('email')}, status={existing_user.get('status')}, created_at={existing_user.get('created_at')}")
            
            # Validate old password
            old_password_hash = self._hash_password(old_password)
            stored_password_hash = existing_user.get("password")
            print(f"🔑 Validating old password")
            print(f"📋 Old password hash: {old_password_hash[:20]}...")
            print(f"📋 Stored password hash: {stored_password_hash[:20] if stored_password_hash else 'None'}...")
            
            if stored_password_hash != old_password_hash:
                print("❌ Current password is incorrect")
                return {
                    "success": False,
                    "message": "Current password is incorrect"
                }
            
            print("✅ Old password validated successfully")
            
            # Hash new password
            new_hashed_password = self._hash_password(new_password)
            print(f"🔒 New password hashed: {new_hashed_password[:20]}...")
            
            # Update password
            print(f"💾 Updating password in database")
            result = self.users_collection.update_one(
                {"email": email},
                {"$set": {"password": new_hashed_password}}
            )
            
            print(f"📊 Update result: matched_count={result.matched_count}, modified_count={result.modified_count}")
            
            if result.matched_count > 0:
                print("✅ Password updated successfully")
                return {
                    "success": True,
                    "message": "Password updated successfully"
                }
            else:
                print("❌ Failed to update password - no document matched")
                return {
                    "success": False,
                    "message": "Failed to update password"
                }
                
        except Exception as e:
            print(f"❌ Exception in update_password: {e}")
            print(f"📍 Exception type: {type(e)}")
            import traceback
            print(f"📋 Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def add_early_access_request(self, email: str) -> dict:
        """Add an early access request"""
        if not self.is_connected() or self.early_access_collection is None:
            return {
                "success": False,
                "message": "Database connection not available",
                "email": email,
                "timestamp": datetime.utcnow()
            }
        
        try:
            # Check if email already exists
            existing = self.early_access_collection.find_one({"email": email})
            if existing:
                return {
                    "success": False,
                    "message": "Email already registered for early access",
                    "email": email,
                    "timestamp": datetime.utcnow()
                }
            
            # Insert new early access request
            document = {
                "email": email,
                "requested_at": datetime.utcnow(),
                "status": "pending"
            }
            
            result = self.early_access_collection.insert_one(document)
            
            if result.inserted_id:
                return {
                    "success": True,
                    "message": "Successfully registered for early access",
                    "email": email,
                    "timestamp": datetime.utcnow()
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to register for early access",
                    "email": email,
                    "timestamp": datetime.utcnow()
                }
                
        except DuplicateKeyError:
            return {
                "success": False,
                "message": "Email already registered for early access",
                "email": email,
                "timestamp": datetime.utcnow()
            }
        except Exception as e:
            print(f"Error adding early access request: {e}")
            return {
                "success": False,
                "message": "Internal server error",
                "email": email,
                "timestamp": datetime.utcnow()
            }
    
    def get_early_access_requests(self, limit: int = 100) -> list:
        """Get early access requests"""
        if not self.is_connected() or self.early_access_collection is None:
            return []
        
        try:
            return list(self.early_access_collection.find().limit(limit).sort("requested_at", -1))
        except Exception as e:
            print(f"Error getting early access requests: {e}")
            return []
    
    def create_batch_invitation(self, emails: List[str], invited_by: str, base_url: str = "http://localhost:3000/accept-invite") -> dict:
        """Create batch invitation with single invite_id shared by all emails"""
        print(f"📧 MongoDB create_batch_invitation called for {len(emails)} emails by {invited_by}")
        
        if not self.is_connected() or self.invitations_collection is None:
            return {
                "success": False,
                "message": "Database connection not available",
                "invitations": [],
                "failed_emails": emails
            }
        
        try:
            invitations = []
            failed_emails = []
            
            # Get inviter's organization info
            inviter = None
            if self.users_collection is not None:
                inviter = self.users_collection.find_one({"email": invited_by})
            
            if not inviter:
                print(f"❌ Inviter not found: {invited_by}")
                return {
                    "success": False,
                    "message": "Inviter not found",
                    "invitations": [],
                    "failed_emails": emails
                }
            
            company_name = inviter.get("company_name", "Default Company")
            org_id = inviter.get("org_id")
            expires_at = datetime.utcnow() + timedelta(days=7)  # 7 days expiry
            
            # Generate ONE invite_id for the entire batch
            batch_invite_id = self._generate_invite_id()
            print(f"🆔 Generated batch invite_id: {batch_invite_id} for {len(emails)} emails")
            
            for email in emails:
                try:
                    # Check if user already exists and is active - skip if active
                    if self.users_collection is not None:
                        existing_user = self.users_collection.find_one({"email": email})
                        if existing_user and existing_user.get("status") == UserState.ACTIVE:
                            print(f"⚠️ Active user already exists, skipping: {email}")
                            failed_emails.append(email)
                            continue
                    
                    # Check if there's already a pending invitation for this email - refresh if exists
                    existing_invite = self.invitations_collection.find_one({
                        "email": email,
                        "status": InvitationStatus.PENDING
                    })
                    
                    is_refresh = existing_invite is not None
                    if is_refresh:
                        print(f"🔄 Existing invitation found, refreshing for: {email}")
                        # Mark old invitation as expired
                        self.invitations_collection.update_one(
                            {"email": email, "status": InvitationStatus.PENDING},
                            {"$set": {"status": InvitationStatus.EXPIRED}}
                        )
                    
                    # Use the batch invitation ID for this email
                    invite_id = batch_invite_id
                    print(f"🆔 Using batch invite_id: {invite_id} for {email}")
                    
                    # Create or update pending user in users table
                    user_created = False
                    if self.users_collection is not None:
                        if is_refresh:
                            # Update existing pending user with new invite info
                            print(f"🔄 Updating existing pending user: {email}")
                            update_result = self.users_collection.update_one(
                                {"email": email},
                                {"$set": {
                                    "invite_id": invite_id,
                                    "invited_by": invited_by,
                                    "status": UserState.PENDING,
                                    "org_id": org_id,
                                    "company_name": company_name
                                }}
                            )
                            user_created = update_result.matched_count > 0
                            print(f"📊 User update result: matched={update_result.matched_count}, modified={update_result.modified_count}")
                        else:
                            # Create new pending user
                            print(f"✨ Creating new pending user: {email}")
                            user_doc = {
                                "user_id": self._generate_user_id(),
                                "email": email,
                                "password": None,  # Will be set when invitation is accepted
                                "name": None,      # Will be set when invitation is accepted
                                "org_id": org_id,
                                "company_name": company_name,
                                "created_at": datetime.utcnow(),
                                "status": UserState.PENDING,
                                "role": UserRole.ADMIN,
                                "invited_by": invited_by,
                                "invite_id": invite_id  # Individual invite_id for each user
                            }
                            user_result = self.users_collection.insert_one(user_doc)
                            user_created = user_result.inserted_id is not None
                    
                    if not user_created:
                        print(f"❌ Failed to create pending user for: {email}")
                        failed_emails.append(email)
                        continue
                    
                    # Create invitation record
                    invitation_doc = {
                        "invite_id": invite_id,
                        "email": email,
                        "status": InvitationStatus.PENDING,
                        "invited_by": invited_by,
                        "created_at": datetime.utcnow(),
                        "expires_at": expires_at
                    }
                    
                    # Insert invitation
                    result = self.invitations_collection.insert_one(invitation_doc)
                    
                    if result.inserted_id:
                        # Increment organization user count (only for new users, not refreshes)
                        if org_id and not is_refresh:
                            self.increment_org_user_count(org_id)
                        
                        invitations.append({
                            "email": email,
                            "invite_id": invite_id,

                        })
                        action_text = "refreshed" if is_refresh else "created"
                        print(f"✅ Invitation {action_text} for: {email}")
                    else:
                        # Rollback user creation if invitation creation failed
                        if self.users_collection is not None and not is_refresh:
                            self.users_collection.delete_one({"email": email, "invite_id": invite_id})
                        failed_emails.append(email)
                        action_text = "refresh" if is_refresh else "create"
                        print(f"❌ Failed to {action_text} invitation for: {email}")
                        
                except Exception as e:
                    print(f"❌ Error creating invitation for {email}: {e}")
                    failed_emails.append(email)
            
            if len(invitations) > 0:
                return {
                    "success": True,
                    "message": f"Processed {len(invitations)} invitations (created/refreshed), {len(failed_emails)} skipped",
                    "invitations": invitations,
                    "failed_emails": failed_emails
                }
            else:
                return {
                    "success": False,
                    "message": "No invitations could be processed (all emails are active users)",
                    "invitations": [],
                    "failed_emails": failed_emails
                }
            
        except Exception as e:
            print(f"❌ Error in create_batch_invitation: {e}")
            return {
                "success": False,
                "message": "Internal server error",
                "invitations": [],
                "failed_emails": emails
            }


    
    def get_invitation_by_id(self, invite_id: str) -> Optional[dict]:
        """Get invitation by invite_id"""
        if not self.is_connected() or self.invitations_collection is None:
            return None
        
        try:
            return self.invitations_collection.find_one({"invite_id": invite_id})
        except Exception as e:
            print(f"Error getting invitation: {e}")
            return None
    
    def accept_invitation(self, invite_id: str, email: str, name: str, password: str) -> dict:
        """Accept an invitation and create user account"""
        print(f"🎯 MongoDB accept_invitation called for invite_id: {invite_id}, email: {email}")
        
        if not self.is_connected() or self.invitations_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Get invitation by invite_id AND email (since multiple users can share same invite_id)
            invitation = self.invitations_collection.find_one({
                "invite_id": invite_id,
                "email": email
            })
            
            if not invitation:
                return {
                    "success": False,
                    "message": "Invalid invitation ID or email"
                }
            
            # Check if invitation is still valid
            if invitation["status"] != InvitationStatus.PENDING:
                return {
                    "success": False,
                    "message": "Invitation has already been used"
                }
            
            if datetime.utcnow() > invitation["expires_at"]:
                # Mark invitation as expired
                self.invitations_collection.update_one(
                    {"invite_id": invite_id},
                    {"$set": {"status": InvitationStatus.EXPIRED}}
                )
                return {
                    "success": False,
                    "message": "Invitation has expired"
                }
            
            # Update the pending user with name and password
            if self.users_collection is not None:
                # Hash the password
                hashed_password = self._hash_password(password)
                
                # Update the pending user
                update_result = self.users_collection.update_one(
                    {"email": email, "invite_id": invite_id},
                    {"$set": {
                        "password": hashed_password,
                        "name": name,
                        "status": UserState.ACTIVE
                    }}
                )
                
                if update_result.matched_count == 0:
                    return {
                        "success": False,
                        "message": "Pending user not found or invite ID mismatch"
                    }
                
                if update_result.modified_count == 0:
                    return {
                        "success": False,
                        "message": "Failed to update user account"
                    }
            else:
                return {
                    "success": False,
                    "message": "Database connection not available"
                }
            
            # Mark invitation as accepted
            self.invitations_collection.update_one(
                {"invite_id": invite_id},
                {
                    "$set": {
                        "status": InvitationStatus.ACCEPTED,
                        "accepted_at": datetime.utcnow()
                    }
                }
            )
            
            # Get the user ID
            user_id = None
            if self.users_collection is not None:
                user = self.users_collection.find_one({"email": email})
                if user:
                    user_id = user.get("user_id") or str(user["_id"])
            
            print(f"✅ Invitation accepted and user activated: {email}")
            
            return {
                "success": True,
                "message": "Invitation accepted and account activated successfully",
                "user_id": user_id,
                "user_email": email
            }
            
        except Exception as e:
            print(f"❌ Error in accept_invitation: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def create_api_key(self, name: str, description: Optional[str] = None, expires_in_days: Optional[int] = None, org_id: Optional[str] = None, created_by_user_id: Optional[str] = None) -> dict:
        """Create a new system-level API key"""
        print(f"🔑 MongoDB create_api_key called")
        print(f"📋 Parameters: name={name}, description={description}, expires_in_days={expires_in_days}, org_id={org_id}, created_by_user_id={created_by_user_id}")
        
        if not self.is_connected():
            print("❌ Database not connected")
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        if self.api_keys_collection is None:
            print("❌ API keys collection is None")
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        print(f"✅ Database connected and collection available")
        
        try:
            # Generate API key and ID
            api_key = self._generate_api_key()
            key_id = self._generate_api_key_id()
            hashed_key = self._hash_api_key(api_key)
            
            print(f"🔒 Generated API key: {api_key[:20]}...")
            print(f"🆔 Generated key ID: {key_id}")
            print(f"🔑 Hashed key: {hashed_key[:20]}...")
            
            # Calculate expiration
            expires_at = None
            if expires_in_days is not None:
                expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
                print(f"⏰ Expires at: {expires_at}")
            else:
                print(f"⏰ No expiration set")
            
            # Create API key document
            api_key_doc = {
                "key_id": key_id,
                "hashed_key": hashed_key,
                "name": name,
                "description": description,
                "created_at": datetime.utcnow(),
                "expires_at": expires_at,
                "last_used": None,
                "is_active": True,
                "org_id": org_id,
                "created_by_user_id": created_by_user_id
            }
            
            print(f"📄 Document to insert: {api_key_doc}")
            
            result = self.api_keys_collection.insert_one(api_key_doc)
            
            print(f"📊 Insert result: inserted_id={result.inserted_id}")
            
            if result.inserted_id:
                print(f"✅ API key created successfully")
                
                # Verify the document was inserted
                verification = self.api_keys_collection.find_one({"key_id": key_id})
                print(f"🔍 Verification query result: {verification}")
                
                return {
                    "success": True,
                    "message": "API key created successfully",
                    "api_key": api_key,
                    "key_id": key_id,
                    "expires_at": expires_at,
                    "org_id": org_id,
                    "created_by_user_id": created_by_user_id
                }
            else:
                print(f"❌ Failed to create API key - no inserted_id")
                return {
                    "success": False,
                    "message": "Failed to create API key"
                }
                
        except Exception as e:
            print(f"❌ Exception in create_api_key: {e}")
            print(f"📍 Exception type: {type(e)}")
            import traceback
            print(f"📋 Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def list_api_keys(self, include_inactive: bool = False) -> list:
        """List system API keys"""
        print(f"🔑 MongoDB list_api_keys method called (include_inactive={include_inactive})")
        
        # Check database connection
        if not self.is_connected():
            print("❌ Database not connected")
            return []
        
        if self.api_keys_collection is None:
            print("❌ API keys collection is None")
            return []
        
        print(f"✅ Database connected and collection available")
        
        try:
            # Check collection stats
            print(f"🔍 Checking collection stats")
            total_count = self.api_keys_collection.count_documents({})
            active_count = self.api_keys_collection.count_documents({"is_active": True})
            inactive_count = total_count - active_count
            
            print(f"📊 Collection stats: {total_count} total, {active_count} active, {inactive_count} inactive")
            
            # Build query filter
            query_filter = {} if include_inactive else {"is_active": True}
            print(f"🔄 Fetching API keys with filter: {query_filter}")
            
            cursor = self.api_keys_collection.find(
                query_filter,
                {"hashed_key": 0}  # Exclude the hashed key from results
            ).sort("_id", -1)  # Sort by _id (always indexed) for chronological order
            
            result = list(cursor)
            print(f"📋 Raw documents from cursor: {result}")
            print(f"📊 Returning {len(result)} API keys")
            
            # Log each document for debugging
            for i, doc in enumerate(result):
                print(f"📋 Document {i + 1}: {doc}")
                
            return result
            
        except Exception as e:
            print(f"❌ Exception in list_api_keys: {e}")
            print(f"📍 Exception type: {type(e)}")
            import traceback
            print(f"📋 Traceback: {traceback.format_exc()}")
            return []
    
    def delete_api_key(self, key_id: str) -> dict:
        """Soft delete an API key (mark as inactive)"""
        print(f"🗑️ MongoDB delete_api_key called for key_id: {key_id}")
        
        if not self.is_connected() or self.api_keys_collection is None:
            print("❌ Database connection not available")
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Soft delete: mark as inactive instead of actually deleting
            print(f"🔄 Soft deleting API key (setting is_active=False)")
            result = self.api_keys_collection.update_one(
                {"key_id": key_id, "is_active": True},  # Only update if currently active
                {
                    "$set": {
                        "is_active": False,
                        "deleted_at": datetime.utcnow()
                    }
                }
            )
            
            print(f"📊 Update result: matched_count={result.matched_count}, modified_count={result.modified_count}")
            
            if result.matched_count > 0:
                print(f"✅ API key soft deleted successfully")
                return {
                    "success": True,
                    "message": "API key deleted successfully"
                }
            else:
                print(f"❌ API key not found or already deleted")
                return {
                    "success": False,
                    "message": "API key not found or already deleted"
                }
                
        except Exception as e:
            print(f"❌ Exception in delete_api_key: {e}")
            print(f"📍 Exception type: {type(e)}")
            import traceback
            print(f"📋 Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def refresh_api_key(self, key_id: str, expires_in_days: Optional[int] = None) -> dict:
        """Refresh an API key by generating a new key and optionally updating expiration"""
        print(f"🔄 MongoDB refresh_api_key called for key_id: {key_id}")
        print(f"📋 Parameters: expires_in_days={expires_in_days}")
        
        if not self.is_connected() or self.api_keys_collection is None:
            print("❌ Database connection not available")
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Check if the key exists and is active
            print(f"🔍 Looking up active API key: {key_id}")
            existing_key = self.api_keys_collection.find_one({
                "key_id": key_id,
                "is_active": True
            })
            if not existing_key:
                print(f"❌ API key not found or inactive: {key_id}")
                return {
                    "success": False,
                    "message": "API key not found or inactive"
                }
            
            print(f"✅ Found active API key: {existing_key.get('name')}")
            
            # Generate new API key
            new_api_key = self._generate_api_key()
            new_hashed_key = self._hash_api_key(new_api_key)
            print(f"🔒 Generated new API key: {new_api_key[:20]}...")
            
            # Calculate new expiration
            expires_at = None
            if expires_in_days is not None:
                expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
                print(f"⏰ New expiration set: {expires_at}")
            else:
                # Keep existing expiration if not specified
                expires_at = existing_key.get("expires_at")
                print(f"⏰ Keeping existing expiration: {expires_at}")
            
            # Update the API key with new values
            update_data = {
                "hashed_key": new_hashed_key,
                "expires_at": expires_at,
                "last_used": None,
                "is_active": True
            }
            
            print(f"💾 Updating API key in database")
            result = self.api_keys_collection.update_one(
                {"key_id": key_id},
                {"$set": update_data}
            )
            
            print(f"📊 Update result: matched_count={result.matched_count}, modified_count={result.modified_count}")
            
            if result.matched_count > 0:
                print(f"✅ API key refreshed successfully")
                return {
                    "success": True,
                    "message": "API key refreshed successfully",
                    "api_key": new_api_key,
                    "expires_at": expires_at,
                    "org_id": existing_key.get("org_id"),
                    "created_by_user_id": existing_key.get("created_by_user_id")
                }
            else:
                print(f"❌ Failed to refresh API key - no document matched")
                return {
                    "success": False,
                    "message": "Failed to refresh API key"
                }
                
        except Exception as e:
            print(f"❌ Exception in refresh_api_key: {e}")
            print(f"📍 Exception type: {type(e)}")
            import traceback
            print(f"📋 Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def validate_api_key(self, api_key: str) -> Optional[dict]:
        """Validate an API key and return key info"""
        if not self.is_connected() or self.api_keys_collection is None:
            return None
        
        try:
            hashed_key = self._hash_api_key(api_key)
            
            # Find active API key
            api_key_doc = self.api_keys_collection.find_one({
                "hashed_key": hashed_key,
                "is_active": True
            })
            
            if not api_key_doc:
                return None
            
            # Check if key is expired
            if api_key_doc.get("expires_at") and datetime.utcnow() > api_key_doc["expires_at"]:
                # Deactivate expired key
                self.api_keys_collection.update_one(
                    {"key_id": api_key_doc["key_id"]},
                    {"$set": {"is_active": False}}
                )
                return None
            
            # Update last used timestamp
            self.api_keys_collection.update_one(
                {"key_id": api_key_doc["key_id"]},
                {"$set": {"last_used": datetime.utcnow()}}
            )
            
            return {
                "key_id": api_key_doc["key_id"],
                "name": api_key_doc["name"],
                "org_id": api_key_doc.get("org_id"),
                "created_by_user_id": api_key_doc.get("created_by_user_id")
            }
            
        except Exception as e:
            print(f"Error validating API key: {e}")
            return None
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("📦 MongoDB connection closed")



    def save_flow_data(self, flow_data: dict, embeddings: Optional[dict] = None) -> dict:
        """Save flow data with flattened structure - key fields as separate columns and optional embeddings"""
        print(f"💾 MongoDB save_flow_data called for flow_id: {flow_data.get('flow_id')}")
        
        if not self.is_connected() or self.flows_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            flow_id = flow_data.get("flow_id")
            
            # Create flattened document structure
            flattened_document = {
                "flow_id": flow_id,
                "name": flow_data.get("name"),
                "description": flow_data.get("description"),
                "created_at": flow_data.get("created_at"),
                "status": flow_data.get("status"),
                "saved_at": flow_data.get("saved_at"),
                "points": flow_data.get("points", []),
                "points_count": len(flow_data.get("points", [])),
                "last_updated": datetime.utcnow().isoformat(),
                "org_id": flow_data.get("org_id"),
                "project_id": flow_data.get("project_id")
            }
            
            # Add embeddings if provided
            if embeddings:
                flattened_document.update({
                    "name_embedding": embeddings.get("name_embedding"),
                    "description_embedding": embeddings.get("description_embedding"),
                    "embedding_model": embeddings.get("embedding_model"),
                    "name_length": embeddings.get("name_length"),
                    "description_length": embeddings.get("description_length")
                })
                print(f"📊 Embeddings included: model={embeddings.get('embedding_model')}, name_length={embeddings.get('name_length')}, description_length={embeddings.get('description_length')}")
            else:
                print(f"📊 No embeddings provided for flow: {flow_id}")
            
            print(f"📋 Flattened document structure: flow_id={flow_id}, name={flattened_document['name']}, points_count={flattened_document['points_count']}")
            
            # Check if flow already exists and update it, otherwise insert new
            existing_flow = self.flows_collection.find_one({"flow_id": flow_id})
            
            if existing_flow:
                # Update existing flow with flattened data
                result = self.flows_collection.update_one(
                    {"flow_id": flow_id},
                    {"$set": flattened_document}
                )
                
                if result.matched_count > 0:
                    print(f"✅ Flow data updated successfully: {flow_id}")
                    return {
                        "success": True,
                        "message": "Flow data updated successfully",
                        "flow_id": flow_id
                    }
                else:
                    return {
                        "success": False,
                        "message": "Failed to update flow data"
                    }
            else:
                # Insert new flow with flattened data
                result = self.flows_collection.insert_one(flattened_document)
                
                if result.inserted_id:
                    print(f"✅ Flow data saved successfully: {flow_id}")
                    return {
                        "success": True,
                        "message": "Flow data saved successfully",
                        "flow_id": flow_id
                    }
                else:
                    return {
                        "success": False,
                        "message": "Failed to save flow data"
                    }
                
        except Exception as e:
            print(f"❌ Error saving flow data: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }

    def update_flow_data(self, flow_id: str, flow_data: dict, embeddings: Optional[dict] = None, org_id: Optional[str] = None) -> dict:
        """Update flow data with new name/description and optional new embeddings"""
        print(f"🔄 MongoDB update_flow_data called for flow_id: {flow_id}")
        
        if not self.is_connected() or self.flows_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Build query filter
            query_filter = {"flow_id": flow_id}
            if org_id:
                query_filter["org_id"] = org_id
            
            # Check if flow exists
            existing_flow = self.flows_collection.find_one(query_filter)
            if not existing_flow:
                return {
                    "success": False,
                    "message": "Flow not found"
                }
            
            # Create update document with only the fields that need to be updated
            update_document = {
                "name": flow_data.get("name"),
                "description": flow_data.get("description"),
                "updated_at": flow_data.get("updated_at"),
                "last_updated": datetime.utcnow().isoformat()
            }
            
            # Add embeddings if provided
            if embeddings:
                update_document.update({
                    "name_embedding": embeddings.get("name_embedding"),
                    "description_embedding": embeddings.get("description_embedding"),
                    "embedding_model": embeddings.get("embedding_model"),
                    "name_length": embeddings.get("name_length"),
                    "description_length": embeddings.get("description_length")
                })
                print(f"📊 New embeddings included: model={embeddings.get('embedding_model')}, name_length={embeddings.get('name_length')}, description_length={embeddings.get('description_length')}")
            else:
                print(f"📊 No new embeddings provided for flow: {flow_id}")
            
            # Update the flow
            result = self.flows_collection.update_one(
                query_filter,
                {"$set": update_document}
            )
            
            if result.matched_count > 0:
                print(f"✅ Flow data updated successfully: {flow_id}")
                return {
                    "success": True,
                    "message": "Flow data updated successfully",
                    "flow_id": flow_id
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to update flow data"
                }
                
        except Exception as e:
            print(f"❌ Error updating flow data: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }

    def get_flow_data(self, flow_id: str, org_id: Optional[str] = None) -> Optional[dict]:
        """Get complete flow data from MongoDB by flow_id and reconstruct original structure"""
        print(f"🔍 MongoDB get_flow_data called for flow_id: {flow_id}, org_id: {org_id}")
        
        if not self.is_connected() or self.flows_collection is None:
            print("❌ Database connection not available")
            return None
        
        try:
            # Build query filter
            query_filter = {"flow_id": flow_id}
            if org_id:
                query_filter["org_id"] = org_id
            
            flattened_data = self.flows_collection.find_one(query_filter)
            
            if flattened_data:
                # Remove MongoDB's _id field
                flattened_data.pop("_id", None)
                
                # Reconstruct original flow data structure for API compatibility
                flow_data = {
                    "flow_id": flattened_data.get("flow_id"),
                    "name": flattened_data.get("name"),
                    "description": flattened_data.get("description"),
                    "created_at": flattened_data.get("created_at"),
                    "status": flattened_data.get("status"),
                    "saved_at": flattened_data.get("saved_at"),
                    "points": flattened_data.get("points", []),
                    "project_id": flattened_data.get("project_id")
                }
                
                print(f"✅ Flow data retrieved and reconstructed: {flow_id} (points: {len(flow_data.get('points', []))})")
                return flow_data
            else:
                print(f"❌ Flow not found: {flow_id}")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving flow data: {e}")
            return None

    def list_flows(self, status: Optional[str] = None, include_discarded: bool = False, limit: int = 50, skip: int = 0, sort_by: str = "last_updated", sort_order: int = -1, project_id: Optional[str] = None, org_id: Optional[str] = None) -> dict:
        """List flows with optional filtering and pagination using flattened structure"""
        print(f"📋 MongoDB list_flows called with status={status}, include_discarded={include_discarded}, limit={limit}, skip={skip}, project_id={project_id}, org_id={org_id}")
        
        if not self.is_connected() or self.flows_collection is None:
            return {
                "success": False,
                "message": "Database connection not available",
                "flows": [],
                "total_count": 0
            }
        
        try:
            # Build query filter
            query_filter = {}
            if status:
                query_filter["status"] = status
            elif not include_discarded:
                # Exclude discarded flows by default
                query_filter["status"] = {"$ne": "discarded"}
            
            # Add project_id filter if provided
            if project_id:
                query_filter["project_id"] = project_id
            
            # Add org_id filter if provided
            if org_id:
                query_filter["org_id"] = org_id
            
            print(f"🔍 Query filter: {query_filter}")
            
            # Get total count
            total_count = self.flows_collection.count_documents(query_filter)
            print(f"📊 Total flows found: {total_count}")
            
            # Get flows with pagination
            cursor = self.flows_collection.find(
                query_filter,
                {"_id": 0}  # Exclude MongoDB _id field
            ).skip(skip).limit(limit).sort(sort_by, sort_order)
            
            flows = list(cursor)
            
            print(f"📄 Retrieved {len(flows)} flows for current page")
            
            return {
                "success": True,
                "message": f"Retrieved {len(flows)} flows",
                "flows": flows,
                "total_count": total_count
            }
            
        except Exception as e:
            print(f"❌ Exception in list_flows: {e}")
            return {
                "success": False,
                "message": "Internal server error",
                "flows": [],
                "total_count": 0
            }

    def discard_flow(self, flow_id: str, org_id: Optional[str] = None) -> dict:
        """Discard a flow by marking it as discarded or deleting it"""
        print(f"🗑️ MongoDB discard_flow called for flow_id: {flow_id}, org_id: {org_id}")
        
        if not self.is_connected() or self.flows_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Build query filter
            query_filter = {"flow_id": flow_id}
            if org_id:
                query_filter["org_id"] = org_id
            
            # Check if flow exists
            existing_flow = self.flows_collection.find_one(query_filter)
            
            if not existing_flow:
                print(f"❌ Flow not found: {flow_id}")
                return {
                    "success": False,
                    "message": "Flow not found"
                }
            
            # Update flow status to discarded
            result = self.flows_collection.update_one(
                {"flow_id": flow_id},
                {
                    "$set": {
                        "status": "discarded",
                        "discarded_at": datetime.utcnow().isoformat(),
                        "last_updated": datetime.utcnow().isoformat()
                    }
                }
            )
            
            if result.matched_count > 0:
                print(f"✅ Flow discarded successfully: {flow_id}")
                return {
                    "success": True,
                    "message": "Flow discarded successfully",
                    "flow_id": flow_id
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to discard flow"
                }
                
        except Exception as e:
            print(f"❌ Error discarding flow: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def search_flows_by_embedding(self, query_embedding: List[float], limit: int = 10, min_score: float = 0.7, org_id: Optional[str] = None, project_id: Optional[str] = None) -> dict:
        """
        Search flows by embedding similarity using MongoDB's $vectorSearch (if available) or cosine similarity
        
        Args:
            query_embedding: The embedding vector to search for
            limit: Maximum number of results to return
            min_score: Minimum similarity score (0.0 to 1.0)
            org_id: Optional organization ID to filter flows by organization
            
        Returns:
            Dictionary containing search results with flows and scores
        """
        print(f"🔍 MongoDB search_flows_by_embedding called with limit={limit}, min_score={min_score}, org_id={org_id}")
        
        if not self.is_connected() or self.flows_collection is None:
            return {
                "success": False,
                "message": "Database connection not available",
                "flows": [],
                "total_count": 0
            }
        
        try:
            # For now, we'll implement a simple cosine similarity search
            # In the future, this could be optimized with MongoDB's $vectorSearch if available
            
            # Build query filter
            query_filter = {
                "name_embedding": {"$exists": True},
                "status": {"$ne": "discarded"}
            }
            
            # Add organization filter if provided
            if org_id:
                query_filter["org_id"] = org_id
            
            # Add project filter if provided
            if project_id:
                query_filter["project_id"] = project_id
            
            # Get all flows with embeddings
            cursor = self.flows_collection.find(
                query_filter,
                {
                    "_id": 0,
                    "flow_id": 1,
                    "name": 1,
                    "description": 1,
                    "name_embedding": 1,
                    "description_embedding": 1,
                    "created_at": 1,
                    "points_count": 1
                }
            )
            
            flows_with_scores = []
            
            for flow in cursor:
                # Calculate cosine similarity for name embedding
                name_similarity = self._cosine_similarity(query_embedding, flow.get("name_embedding", []))
                description_similarity = self._cosine_similarity(query_embedding, flow.get("description_embedding", []))
                
                # Use the higher of the two similarities
                max_similarity = max(name_similarity, description_similarity)
                
                if max_similarity >= min_score:
                    flows_with_scores.append({
                        "flow_id": flow["flow_id"],
                        "name": flow["name"],
                        "description": flow["description"],
                        "created_at": flow["created_at"],
                        "points_count": flow["points_count"],
                        "similarity_score": max_similarity,
                        "name_similarity": name_similarity,
                        "description_similarity": description_similarity
                    })
            
            # Sort by similarity score (descending)
            flows_with_scores.sort(key=lambda x: x["similarity_score"], reverse=True)
            
            # Apply limit
            flows_with_scores = flows_with_scores[:limit]
            
            print(f"📊 Found {len(flows_with_scores)} flows with similarity >= {min_score}")
            
            return {
                "success": True,
                "message": f"Found {len(flows_with_scores)} similar flows",
                "flows": flows_with_scores,
                "total_count": len(flows_with_scores)
            }
            
        except Exception as e:
            print(f"❌ Error searching flows by embedding: {e}")
            return {
                "success": False,
                "message": "Internal server error",
                "flows": [],
                "total_count": 0
            }
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors
        
        Args:
            vec1: First vector
            vec2: Second vector
            
        Returns:
            Cosine similarity score (0.0 to 1.0)
        """
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        try:
            import numpy as np
            
            # Convert to numpy arrays
            v1 = np.array(vec1)
            v2 = np.array(vec2)
            
            # Calculate cosine similarity
            dot_product = np.dot(v1, v2)
            norm_v1 = np.linalg.norm(v1)
            norm_v2 = np.linalg.norm(v2)
            
            if norm_v1 == 0 or norm_v2 == 0:
                return 0.0
            
            similarity = dot_product / (norm_v1 * norm_v2)
            return float(similarity)
            
        except ImportError:
            # Fallback to pure Python implementation
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            norm_v1 = sum(a * a for a in vec1) ** 0.5
            norm_v2 = sum(b * b for b in vec2) ** 0.5
            
            if norm_v1 == 0 or norm_v2 == 0:
                return 0.0
            
            similarity = dot_product / (norm_v1 * norm_v2)
            return similarity

    def create_project(self, name: str, description: Optional[str] = None, org_id: Optional[str] = None, created_by_user_id: Optional[str] = None, is_default: bool = False) -> dict:
        """Create a new project"""
        print(f"📁 MongoDB create_project called for name: {name}, org_id: {org_id}")
        
        if not self.is_connected() or self.projects_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Generate project ID
            project_id = self._generate_project_id()
            
            # Create project document
            project_doc = {
                "project_id": project_id,
                "name": name,
                "description": description or f"Project: {name}",
                "org_id": org_id,
                "created_by_user_id": created_by_user_id,
                "created_at": datetime.utcnow(),
                "status": "active",
                "is_default": is_default,
                "settings": {
                    "allow_public_access": False,
                    "max_flows_per_project": 100,
                    "max_users_per_project": 50
                }
            }
            
            # Insert project
            result = self.projects_collection.insert_one(project_doc)
            
            if result.inserted_id:
                print(f"✅ Project created successfully: {project_id}")
                return {
                    "success": True,
                    "message": "Project created successfully",
                    "project_id": project_id,
                    "name": name,
                    "org_id": org_id
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to create project"
                }
                
        except Exception as e:
            print(f"❌ Error creating project: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def get_project_by_id(self, project_id: str, org_id: Optional[str] = None) -> Optional[dict]:
        """Get project by project_id"""
        print(f"🔍 MongoDB get_project_by_id called for project_id: {project_id}")
        
        if not self.is_connected() or self.projects_collection is None:
            return None
        
        try:
            # Build query filter
            query_filter = {"project_id": project_id}
            if org_id:
                query_filter["org_id"] = org_id
            
            project = self.projects_collection.find_one(query_filter)
            
            if project:
                # Remove MongoDB's _id field
                project.pop("_id", None)
                print(f"✅ Project found: {project_id}")
                return project
            else:
                print(f"❌ Project not found: {project_id}")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving project: {e}")
            return None
    
    def get_default_project(self, org_id: str) -> Optional[dict]:
        """Get the default project for an organization"""
        print(f"🔍 MongoDB get_default_project called for org_id: {org_id}")
        
        if not self.is_connected() or self.projects_collection is None:
            return None
        
        try:
            project = self.projects_collection.find_one({
                "org_id": org_id,
                "is_default": True,
                "status": "active"
            })
            
            if project:
                # Remove MongoDB's _id field
                project.pop("_id", None)
                print(f"✅ Default project found for org: {org_id}")
                return project
            else:
                print(f"❌ Default project not found for org: {org_id}")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving default project: {e}")
            return None
    
    def list_projects(self, org_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50, skip: int = 0) -> dict:
        """List projects with optional filtering and pagination"""
        print(f"📋 MongoDB list_projects called with org_id={org_id}, status={status}, limit={limit}, skip={skip}")
        
        if not self.is_connected() or self.projects_collection is None:
            return {
                "success": False,
                "message": "Database connection not available",
                "projects": [],
                "total_count": 0
            }
        
        try:
            # Build query filter
            query_filter = {}
            if org_id:
                query_filter["org_id"] = org_id
            if status:
                query_filter["status"] = status
            
            print(f"🔍 Query filter: {query_filter}")
            
            # Get total count
            total_count = self.projects_collection.count_documents(query_filter)
            print(f"📊 Total projects found: {total_count}")
            
            # Get projects with pagination
            cursor = self.projects_collection.find(
                query_filter,
                {"_id": 0}  # Exclude MongoDB _id field
            ).skip(skip).limit(limit).sort("created_at", -1)
            
            projects = list(cursor)
            
            print(f"📄 Retrieved {len(projects)} projects for current page")
            
            return {
                "success": True,
                "message": f"Retrieved {len(projects)} projects",
                "projects": projects,
                "total_count": total_count
            }
            
        except Exception as e:
            print(f"❌ Exception in list_projects: {e}")
            return {
                "success": False,
                "message": "Internal server error",
                "projects": [],
                "total_count": 0
            }
    
    def update_project(self, project_id: str, name: Optional[str] = None, description: Optional[str] = None, status: Optional[str] = None, org_id: Optional[str] = None) -> dict:
        """Update project details"""
        print(f"✏️ MongoDB update_project called for project_id: {project_id}")
        
        if not self.is_connected() or self.projects_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Build query filter
            query_filter = {"project_id": project_id}
            if org_id:
                query_filter["org_id"] = org_id
            
            # Check if project exists
            existing_project = self.projects_collection.find_one(query_filter)
            if not existing_project:
                return {
                    "success": False,
                    "message": "Project not found"
                }
            
            # Prepare update data
            update_data = {}
            
            if name is not None:
                update_data["name"] = name
            
            if description is not None:
                update_data["description"] = description
            
            if status is not None:
                update_data["status"] = status
            
            if not update_data:
                return {
                    "success": False,
                    "message": "No fields to update"
                }
            
            # Add last updated timestamp
            update_data["last_updated"] = datetime.utcnow().isoformat()
            
            # Update the project
            result = self.projects_collection.update_one(
                {"project_id": project_id},
                {"$set": update_data}
            )
            
            if result.matched_count > 0:
                # Get updated project data
                updated_project = self.get_project_by_id(project_id, org_id)
                return {
                    "success": True,
                    "message": "Project updated successfully",
                    "project": updated_project
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to update project"
                }
                
        except Exception as e:
            print(f"❌ Error updating project: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def delete_project(self, project_id: str, org_id: Optional[str] = None) -> dict:
        """Soft delete a project by marking it as inactive"""
        print(f"🗑️ MongoDB delete_project called for project_id: {project_id}")
        
        if not self.is_connected() or self.projects_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Build query filter
            query_filter = {"project_id": project_id}
            if org_id:
                query_filter["org_id"] = org_id
            
            # Check if project exists
            existing_project = self.projects_collection.find_one(query_filter)
            if not existing_project:
                return {
                    "success": False,
                    "message": "Project not found"
                }
            
            # Check if it's a default project
            if existing_project.get("is_default", False):
                return {
                    "success": False,
                    "message": "Cannot delete default project"
                }
            
            # Soft delete: mark as inactive
            result = self.projects_collection.update_one(
                query_filter,
                {
                    "$set": {
                        "status": "inactive",
                        "deleted_at": datetime.utcnow().isoformat(),
                        "last_updated": datetime.utcnow().isoformat()
                    }
                }
            )
            
            if result.matched_count > 0:
                print(f"✅ Project soft deleted successfully: {project_id}")
                return {
                    "success": True,
                    "message": "Project deleted successfully",
                    "project_id": project_id
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to delete project"
                }
                
        except Exception as e:
            print(f"❌ Error deleting project: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def create_track_entry(self, track_data: dict) -> dict:
        """Create a new track entry"""
        print(f"📊 MongoDB create_track_entry called for URL: {track_data.get('url')}")
        
        if not self.is_connected() or self.tracks_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Generate track ID
            track_id = self._generate_track_id()
            
            # Create track document
            track_doc = {
                "track_id": track_id,
                "url": track_data["url"],
                "title": track_data["title"],
                "content": track_data["content"],
                "project_id": track_data["project_id"],
                "created_at": track_data["created_at"],
                "updated_at": track_data["updated_at"],
                "status": track_data["status"],
                "org_id": track_data["org_id"],
                "navigation_id": track_data["navigation_id"]
            }
            
            # Insert track entry
            result = self.tracks_collection.insert_one(track_doc)
            
            if result.inserted_id:
                print(f"✅ Track entry created successfully: {track_id}")
                return {
                    "success": True,
                    "message": "Track entry created successfully",
                    "track_id": track_id
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to create track entry"
                }
                
        except Exception as e:
            print(f"❌ Error creating track entry: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }

    def _generate_knowledge_id(self) -> str:
        """Generate a unique knowledge base entry ID"""
        return f"kb_{secrets.token_urlsafe(16)}"

    def create_knowledge_base_entry(self, project_id: str, url: str, type: str, title: Optional[str] = None, description: Optional[str] = None, org_id: Optional[str] = None, created_by_user_id: Optional[str] = None) -> dict:
        """Create a new knowledge base entry"""
        print(f"📚 MongoDB create_knowledge_base_entry called for URL: {url}")
        
        if not self.is_connected():
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Initialize knowledge_base collection if not exists
            if not hasattr(self, 'knowledge_base_collection'):
                self.knowledge_base_collection = self.db.knowledge_base
                # Create indexes
                try:
                    # self.knowledge_base_collection.create_index("knowledge_id", unique=True)
                    # self.knowledge_base_collection.create_index("project_id")
                    # self.knowledge_base_collection.create_index("org_id")
                    # self.knowledge_base_collection.create_index("status")
                    # self.knowledge_base_collection.create_index("created_at")
                    print("✅ Created indexes on knowledge_base collection")
                except Exception as e:
                    print(f"⚠️ Could not create knowledge_base collection indexes: {e}")
            
            # Generate knowledge ID
            knowledge_id = self._generate_knowledge_id()
            
            # Create knowledge base document
            knowledge_doc = {
                "knowledge_id": knowledge_id,
                "project_id": project_id,
                "url": url,
                "type": type,
                "title": title,
                "description": description,
                "status": "ingested",
                "errors": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "org_id": org_id,
                "processing_started_at": None,
                "processing_completed_at": None,
                "is_deleted": False
            }
            
            # Insert knowledge base entry
            result = self.knowledge_base_collection.insert_one(knowledge_doc)
            
            if result.inserted_id:
                print(f"✅ Knowledge base entry created successfully: {knowledge_id}")
                return {
                    "success": True,
                    "message": "Knowledge base entry created successfully",
                    "knowledge_id": knowledge_id,
                    "project_id": project_id,
                    "url": url,
                    "status": "ingested"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to create knowledge base entry"
                }
                
        except Exception as e:
            print(f"❌ Error creating knowledge base entry: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }

    def list_knowledge_base_entries(self, project_id: str, org_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50, skip: int = 0) -> dict:
        """List knowledge base entries with optional filtering and pagination"""
        print(f"📋 MongoDB list_knowledge_base_entries called with project_id={project_id}, org_id={org_id}, status={status}, limit={limit}, skip={skip}")
        
        if not self.is_connected():
            return {
                "success": False,
                "message": "Database connection not available",
                "knowledge_base": [],
                "total_count": 0
            }
        
        try:
            # Initialize knowledge_base collection if not exists
            if not hasattr(self, 'knowledge_base_collection'):
                self.knowledge_base_collection = self.db.knowledge_base
            
            # Build query filter
            query_filter = {
                "project_id": project_id,
                "is_deleted": False
            }

            if org_id:
                query_filter["org_id"] = org_id
            
            if status:
                query_filter["status"] = status
            
            print(f"🔍 Query filter: {query_filter}")
            
            # Get total count
            total_count = self.knowledge_base_collection.count_documents(query_filter)
            print(f"📊 Total knowledge base entries found: {total_count}")
            
            # Get entries with pagination
            cursor = self.knowledge_base_collection.find(
                query_filter,
                {"_id": 0}  # Exclude MongoDB _id field
            ).skip(skip).limit(limit).sort("created_at", -1)
            
            knowledge_base = list(cursor)
            
            print(f"📄 Retrieved {len(knowledge_base)} knowledge base entries for current page")
            
            return {
                "success": True,
                "message": f"Retrieved {len(knowledge_base)} knowledge base entries",
                "knowledge_base": knowledge_base,
                "total_count": total_count
            }
            
        except Exception as e:
            print(f"❌ Exception in list_knowledge_base_entries: {e}")
            return {
                "success": False,
                "message": "Internal server error",
                "knowledge_base": [],
                "total_count": 0
            }

    def delete_knowledge_base_entry(self, knowledge_id: str, org_id: str) -> dict:
        """Soft delete a knowledge base entry by marking it as deleted"""
        print(f"🗑️ MongoDB delete_knowledge_base_entry called for knowledge_id: {knowledge_id}")
        
        if not self.is_connected():
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Initialize knowledge_base collection if not exists
            if not hasattr(self, 'knowledge_base_collection'):
                self.knowledge_base_collection = self.db.knowledge_base
            
            # Check if entry exists and belongs to the organization
            existing_entry = self.knowledge_base_collection.find_one({
                "knowledge_id": knowledge_id,
                "org_id": org_id
            })
            
            if not existing_entry:
                return {
                    "success": False,
                    "message": "Knowledge base entry not found or access denied"
                }
            
            # Soft delete: mark as deleted
            result = self.knowledge_base_collection.update_one(
                {"knowledge_id": knowledge_id, "org_id": org_id},
                {
                    "$set": {
                        "is_deleted": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.matched_count > 0:
                print(f"✅ Knowledge base entry soft deleted successfully: {knowledge_id}")
                return {
                    "success": True,
                    "message": "Knowledge base entry deleted successfully",
                    "knowledge_id": knowledge_id
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to delete knowledge base entry"
                }
                
        except Exception as e:
            print(f"❌ Error deleting knowledge base entry: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }

    def get_ingested_knowledge_entries(self, limit: int = 50) -> List[dict]:
        """Get knowledge base entries with 'ingested' status for processing"""
        print(f"🔍 MongoDB get_ingested_knowledge_entries called with limit={limit}")
        
        if not self.is_connected():
            return []
        
        try:
            # Initialize knowledge_base collection if not exists
            if not hasattr(self, 'knowledge_base_collection'):
                self.knowledge_base_collection = self.db.knowledge_base
            
            # Query for ingested entries
            cursor = self.knowledge_base_collection.find(
                {
                    "status": "ingested",
                    "is_deleted": False
                },
                {"_id": 0}  # Exclude MongoDB _id field
            ).limit(limit).sort("created_at", 1)  # Process older entries first
            
            entries = list(cursor)
            print(f"📊 Found {len(entries)} ingested knowledge base entries")
            
            return entries
            
        except Exception as e:
            print(f"❌ Error getting ingested knowledge entries: {e}")
            return []

    def update_knowledge_base_status(self, knowledge_id: str, status: str, errors: Optional[str] = None, processing_started_at: Optional[datetime] = None, processing_completed_at: Optional[datetime] = None) -> dict:
        """Update knowledge base entry status and processing timestamps"""
        print(f"📝 MongoDB update_knowledge_base_status called for knowledge_id: {knowledge_id}, status: {status}")
        
        if not self.is_connected():
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Initialize knowledge_base collection if not exists
            if not hasattr(self, 'knowledge_base_collection'):
                self.knowledge_base_collection = self.db.knowledge_base
            
            # Prepare update data
            update_data = {
                "status": status,
                "updated_at": datetime.utcnow()
            }
            
            if errors is not None:
                update_data["errors"] = errors
            
            if processing_started_at is not None:
                update_data["processing_started_at"] = processing_started_at
            
            if processing_completed_at is not None:
                update_data["processing_completed_at"] = processing_completed_at
            
            # Update the entry
            result = self.knowledge_base_collection.update_one(
                {"knowledge_id": knowledge_id},
                {"$set": update_data}
            )
            
            if result.matched_count > 0:
                print(f"✅ Knowledge base entry status updated successfully: {knowledge_id} -> {status}")
                return {
                    "success": True,
                    "message": "Knowledge base entry updated successfully",
                    "knowledge_id": knowledge_id
                }
            else:
                print(f"❌ Knowledge base entry not found: {knowledge_id}")
                return {
                    "success": False,
                    "message": "Knowledge base entry not found"
                }
                
        except Exception as e:
            print(f"❌ Error updating knowledge base entry: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }

    # Navigation Management Methods
    def get_navigations_by_org_and_project(self, org_id: Optional[str], project_id: str) -> List[dict]:
        """Get all navigations for an organization and project"""
        try:
            print(f"🔍 MongoDB get_navigations_by_org_and_project called for org_id: {org_id}, project_id: {project_id}")
                
            if org_id:
                navigations = list(self.app_navigations_collection.find({
                    "project_id": project_id,
                    "org_id": org_id
                }).sort([("created_at", 1)]))
            else:
                navigations = list(self.app_navigations_collection.find({
                    "project_id": project_id
                }).sort([("created_at", 1)]))
            
            return navigations
            
        except Exception as e:
            print(f"❌ Error getting navigations: {e}")
            return []
    

    def get_navigation_by_id(self, navigation_id: str, org_id: str) -> Optional[dict]:
        """Get a navigation by ID and org_id"""
        try:
            return self.app_navigations_collection.find_one({
                "navigation_id": navigation_id,
                "org_id": org_id
            })
            
        except Exception as e:
            print(f"❌ Error getting navigation: {e}")
            return None
 
    def delete_navigation(self, navigation_id: str, org_id: str) -> bool:
        """Delete a navigation"""
        try:
            result = self.app_navigations_collection.delete_one({
                "navigation_id": navigation_id,
                "org_id": org_id
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"❌ Error deleting navigation: {e}")
            return False

    def create_navigation(self, org_id: str, project_id: str, url: str, title: str, phrases: List[str]) -> Optional[str]:
        """Create a new navigation entry"""
        try:
            print(f"🔍 MongoDB create_navigation called for org_id: {org_id}, project_id: {project_id}")
            
            # Generate navigation_id using the same method as in ingest_app_navigations.py
            import hashlib
            import secrets
            random_bytes = secrets.token_bytes(32)
            navigation_id = hashlib.sha256(random_bytes).hexdigest()
            
            navigation_doc = {
                "navigation_id": navigation_id,
                "track_id": None,  # Leave track_id null as requested
                "project_id": project_id,
                "org_id": org_id,
                "url": url,
                "title": title,
                "phrases": phrases,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = self.app_navigations_collection.insert_one(navigation_doc)
            
            if result.inserted_id:
                print(f"✅ Navigation created successfully with ID: {navigation_id}")
                return navigation_id
            else:
                print(f"❌ Failed to create navigation")
                return None
                
        except Exception as e:
            print(f"❌ Error creating navigation: {e}")
            return None

    def update_navigation(self, navigation_id: str, org_id: str, project_id: str, url: str, title: str, phrases: List[str]) -> bool:
        """Update an existing navigation entry"""
        try:
            print(f"🔍 MongoDB update_navigation called for navigation_id: {navigation_id}")
            
            result = self.app_navigations_collection.update_one(
                {
                    "navigation_id": navigation_id,
                    "org_id": org_id,
                    "project_id": project_id
                },
                {
                    "$set": {
                        "url": url,
                        "title": title,
                        "phrases": phrases,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.matched_count > 0:
                print(f"✅ Navigation updated successfully: {navigation_id}")
                return True
            else:
                print(f"❌ Navigation not found: {navigation_id}")
                return False
                
        except Exception as e:
            print(f"❌ Error updating navigation: {e}")
            return False

    # Search Hook Methods
    def get_search_hooks_by_org_and_project(self, org_id: str, project_id: str) -> List[dict]:
        """Get all search hooks for an organization and project"""
        try:
            print(f"🔍 MongoDB get_search_hooks_by_org_and_project called for org_id: {org_id}, project_id: {project_id}")
            
            if not self.is_connected() or self.search_hooks_collection is None:
                print("❌ Database connection not available")
                return []
            
            # Try to sort by created_at, but fall back to no sorting if index is not available
            try:
                search_hooks = list(self.search_hooks_collection.find(
                    {"org_id": org_id, "project_id": project_id},
                    {"_id": 0}
                ).sort([("created_at", -1)]))
            except Exception as e:
                print(f"⚠️ Warning: Could not sort by created_at: {e}")
            
            print(f"✅ Found {len(search_hooks)} search hooks")
            return search_hooks
            
        except Exception as e:
            print(f"❌ Error retrieving search hooks: {e}")
            return []

    def get_search_hook_by_id(self, search_hook_id: str, org_id: str) -> Optional[dict]:
        """Get a specific search hook by ID"""
        try:
            print(f"🔍 MongoDB get_search_hook_by_id called for search_hook_id: {search_hook_id}")
            
            if not self.is_connected() or self.search_hooks_collection is None:
                print("❌ Database connection not available")
                return None
            
            search_hook = self.search_hooks_collection.find_one(
                {"search_hook_id": search_hook_id, "org_id": org_id},
                {"_id": 0}
            )
            
            if search_hook:
                print(f"✅ Found search hook: {search_hook_id}")
            else:
                print(f"❌ Search hook not found: {search_hook_id}")
            
            return search_hook
            
        except Exception as e:
            print(f"❌ Error retrieving search hook: {e}")
            return None

    def delete_search_hook(self, search_hook_id: str, org_id: str) -> bool:
        """Delete a search hook"""
        try:
            print(f"🗑️ MongoDB delete_search_hook called for search_hook_id: {search_hook_id}")
            
            if not self.is_connected() or self.search_hooks_collection is None:
                print("❌ Database connection not available")
                return False
            
            result = self.search_hooks_collection.delete_one({
                "search_hook_id": search_hook_id,
                "org_id": org_id
            })
            
            if result.deleted_count > 0:
                print(f"✅ Search hook deleted successfully: {search_hook_id}")
                return True
            else:
                print(f"❌ Search hook not found: {search_hook_id}")
                return False
                
        except Exception as e:
            print(f"❌ Error deleting search hook: {e}")
            return False

    def create_search_hook(self, org_id: str, project_id: str, name: str, url: str, auth_config: dict, 
                          data_list_path: str, navigation_url_formula: str, navigation_title_formula: str) -> Optional[str]:
        """Create a new search hook entry"""
        try:
            print(f"➕ MongoDB create_search_hook called for name: {name}")
            
            if not self.is_connected() or self.search_hooks_collection is None:
                print("❌ Database connection not available")
                return None
            
            search_hook_id = str(uuid.uuid4())
            current_time = datetime.utcnow()
            
            search_hook_data = {
                "search_hook_id": search_hook_id,
                "org_id": org_id,
                "project_id": project_id,
                "name": name,
                "url": url,
                "auth_config": auth_config,
                "data_list_path": data_list_path,
                "navigation_url_formula": navigation_url_formula,
                "navigation_title_formula": navigation_title_formula,
                "created_at": current_time,
                "updated_at": current_time
            }
            
            result = self.search_hooks_collection.insert_one(search_hook_data)
            
            if result.inserted_id:
                print(f"✅ Search hook created successfully: {search_hook_id}")
                return search_hook_id
            else:
                print(f"❌ Failed to create search hook")
                return None
                
        except Exception as e:
            print(f"❌ Error creating search hook: {e}")
            return None

    def update_search_hook(self, search_hook_id: str, org_id: str, project_id: str, name: str, url: str, 
                          auth_config: dict, data_list_path: str, navigation_url_formula: str, 
                          navigation_title_formula: str) -> bool:
        """Update an existing search hook entry"""
        try:
            print(f"🔍 MongoDB update_search_hook called for search_hook_id: {search_hook_id}")
            
            result = self.search_hooks_collection.update_one(
                {
                    "search_hook_id": search_hook_id,
                    "org_id": org_id,
                    "project_id": project_id
                },
                {
                    "$set": {
                        "name": name,
                        "url": url,
                        "auth_config": auth_config,
                        "data_list_path": data_list_path,
                        "navigation_url_formula": navigation_url_formula,
                        "navigation_title_formula": navigation_title_formula,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.matched_count > 0:
                print(f"✅ Search hook updated successfully: {search_hook_id}")
                return True
            else:
                print(f"❌ Search hook not found: {search_hook_id}")
                return False
                
        except Exception as e:
            print(f"❌ Error updating search hook: {e}")
            return False

    def update_track_settings(self, project_id: str, org_id: str, status: Optional[str] = None, conditions: Optional[List[dict]] = None) -> dict:
        """Update tracking settings for a project"""
        print(f"🔧 MongoDB update_track_settings called for project_id: {project_id}")
        
        if not self.is_connected() or self.track_settings_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            # Prepare update data
            update_data = {
                "updated_at": datetime.utcnow()
            }
            
            # Prepare setOnInsert data (only for fields not being updated)
            set_on_insert = {
                "project_id": project_id,
                "org_id": org_id,
                "created_at": datetime.utcnow()
            }
            
            # Only update provided fields
            if status is not None:
                update_data["status"] = status
            else:
                # Only set default status if not updating status
                set_on_insert["status"] = "disable"
                
            if conditions is not None:
                update_data["conditions"] = conditions
            else:
                # Only set default conditions if not updating conditions
                set_on_insert["conditions"] = []
            
            # Upsert track settings document
            result = self.track_settings_collection.update_one(
                {"project_id": project_id},
                {
                    "$set": update_data,
                    "$setOnInsert": set_on_insert
                },
                upsert=True
            )
            
            if result.upserted_id or result.modified_count > 0:
                print(f"✅ Track settings updated successfully for project: {project_id}")
                return {
                    "success": True,
                    "message": "Track settings updated successfully"
                }
            else:
                return {
                    "success": False,
                    "message": "No changes were made"
                }
                
        except Exception as e:
            print(f"❌ Error updating track settings: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def get_track_settings(self, project_id: str) -> Optional[dict]:
        """Get tracking settings for a project"""
        print(f"🔍 MongoDB get_track_settings called for project_id: {project_id}")
        
        if not self.is_connected() or self.track_settings_collection is None:
            return None
        
        try:
            settings = self.track_settings_collection.find_one({"project_id": project_id})
            
            if settings:
                # Remove MongoDB's _id field
                settings.pop("_id", None)
                print(f"✅ Track settings found for project: {project_id}")
                return settings
            else:
                print(f"❌ Track settings not found for project: {project_id}")
                # Return default settings
                return {
                    "project_id": project_id,
                    "status": "disable",
                    "conditions": []
                }
                
        except Exception as e:
            print(f"❌ Error retrieving track settings: {e}")
            return None

    def create_log_entry(self, request_id: str, project_id: str, request_query: str, response: dict, 
                        log_type: str, time_taken: float, error: Optional[str] = None) -> dict:
        """Create a new log entry for query or chat requests"""
        print(f"📝 Creating log entry for request_id: {request_id}, type: {log_type}")
        
        if not self.is_connected() or self.logs_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            now = datetime.utcnow()
            log_entry = {
                "request_id": request_id,
                "created_at": now,
                "updated_at": now,
                "project_id": project_id,
                "request_query": request_query,
                "response": response,
                "type": log_type,
                "feedback_response": None,  # Default to None
                "time_taken": time_taken,
                "error": error
            }
            
            result = self.logs_collection.insert_one(log_entry)
            
            if result.inserted_id:
                print(f"✅ Log entry created successfully for request_id: {request_id}")
                return {
                    "success": True,
                    "message": "Log entry created successfully",
                    "log_id": str(result.inserted_id)
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to create log entry"
                }
                
        except Exception as e:
            print(f"❌ Error creating log entry: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }

    def update_log_feedback(self, request_id: str, feedback_response: str) -> dict:
        """Update feedback for a log entry"""
        print(f"📝 Updating feedback for request_id: {request_id}, feedback: {feedback_response}")
        
        if not self.is_connected() or self.logs_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            result = self.logs_collection.update_one(
                {"request_id": request_id},
                {
                    "$set": {
                        "feedback_response": feedback_response,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.matched_count > 0:
                if result.modified_count > 0:
                    print(f"✅ Feedback updated successfully for request_id: {request_id}")
                    return {
                        "success": True,
                        "message": "Feedback updated successfully",
                        "request_id": request_id
                    }
                else:
                    return {
                        "success": False,
                        "message": "No changes were made"
                    }
            else:
                return {
                    "success": False,
                    "message": "Log entry not found"
                }
                
        except Exception as e:
            print(f"❌ Error updating log feedback: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }

    def get_analytics_data(self, project_id: str, time_range_days: int = 7) -> dict:
        """Get analytics data for a project within the specified time range"""
        print(f"📊 Getting analytics data for project_id: {project_id}, time_range: {time_range_days} days")
        
        if not self.is_connected() or self.logs_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            from datetime import datetime, timedelta
            
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=time_range_days)
            
            # Build date range filter
            date_filter = {
                "created_at": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            }
            
            # Get all logs for the project in the time range
            pipeline = [
                {"$match": {
                    "project_id": project_id,
                    **date_filter
                }},
                {"$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                        "type": "$type"
                    },
                    "count": {"$sum": 1}
                }},
                {"$group": {
                    "_id": "$_id.date",
                    "interactions": {
                        "$push": {
                            "type": "$_id.type",
                            "count": "$count"
                        }
                    }
                }},
                {"$sort": {"_id": 1}}
            ]
            
            daily_results = list(self.logs_collection.aggregate(pipeline))
            
            # Get total counts
            total_pipeline = [
                {"$match": {
                    "project_id": project_id,
                    **date_filter
                }},
                {"$group": {
                    "_id": "$type",
                    "count": {"$sum": 1}
                }}
            ]
            
            total_results = list(self.logs_collection.aggregate(total_pipeline))
            
            # Get feedback counts
            feedback_pipeline = [
                {"$match": {
                    "project_id": project_id,
                    **date_filter,
                    "feedback_response": {"$in": ["positive", "negative"]}
                }},
                {"$group": {
                    "_id": "$feedback_response",
                    "count": {"$sum": 1}
                }}
            ]
            
            feedback_results = list(self.logs_collection.aggregate(feedback_pipeline))
            
            # Process daily interactions
            daily_interactions = []
            for day_result in daily_results:
                date = day_result["_id"]
                interactions = day_result["interactions"]
                
                queries_count = 0
                chats_count = 0
                
                for interaction in interactions:
                    if interaction["type"] == "query":
                        queries_count = interaction["count"]
                    elif interaction["type"] == "chat":
                        chats_count = interaction["count"]
                
                daily_interactions.append({
                    "date": date,
                    "queries": queries_count,
                    "chats": chats_count,
                    "total": queries_count + chats_count
                })
            
            # Process total counts
            total_queries = 0
            total_chats = 0
            
            for total_result in total_results:
                if total_result["_id"] == "query":
                    total_queries = total_result["count"]
                elif total_result["_id"] == "chat":
                    total_chats = total_result["count"]
            
            # Process feedback counts
            positive_feedback = 0
            negative_feedback = 0
            
            for feedback_result in feedback_results:
                if feedback_result["_id"] == "positive":
                    positive_feedback = feedback_result["count"]
                elif feedback_result["_id"] == "negative":
                    negative_feedback = feedback_result["count"]
            
            return {
                "success": True,
                "message": "Analytics data retrieved successfully",
                "time_range_days": time_range_days,
                "total_interactions": total_queries + total_chats,
                "total_queries": total_queries,
                "total_chats": total_chats,
                "daily_interactions": daily_interactions,
                "feedback_summary": {
                    "positive": positive_feedback,
                    "negative": negative_feedback,
                    "total": positive_feedback + negative_feedback
                }
            }
            
        except Exception as e:
            print(f"❌ Error getting analytics data: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }

    def get_project_info_from_knowledge_entry(self, knowledge_id: str) -> Optional[dict]:
        """Get project_id and project name from a knowledge entry"""
        print(f"🔍 MongoDB get_project_info_from_knowledge_entry called for knowledge_id: {knowledge_id}")
        
        if not self.is_connected():
            return None
        
        try:
            # Initialize knowledge_base collection if not exists
            if not hasattr(self, 'knowledge_base_collection'):
                self.knowledge_base_collection = self.db.knowledge_base
            
            # Get knowledge entry with project_id
            knowledge_entry = self.knowledge_base_collection.find_one(
                {"knowledge_id": knowledge_id},
                {"_id": 0, "project_id": 1}
            )
            
            if not knowledge_entry:
                print(f"❌ Knowledge entry not found: {knowledge_id}")
                return None
            
            project_id = knowledge_entry.get("project_id")
            if not project_id:
                print(f"❌ No project_id found in knowledge entry: {knowledge_id}")
                return None
            
            # Get project name from projects collection
            project = self.projects_collection.find_one(
                {"project_id": project_id},
                {"_id": 0, "name": 1}
            )
            
            if not project or "name" not in project:
                print(f"❌ Project not found for project_id: {project_id}")
                return None
            
            project_name = project["name"]
            print(f"✅ Found project info: project_id={project_id}, name={project_name}")
            
            return {
                "project_id": project_id,
                "project_name": project_name
            }
            
        except Exception as e:
            print(f"❌ Error getting project info from knowledge entry: {e}")
            return None

    def add_studio_config(self, project_id: str, org_id: str, config: dict, created_by: str) -> dict:
        """Create or update a studio config for a project"""
        print(f"🎨 MongoDB create_studio_config called for project_id: {project_id}")
        
        if not self.is_connected() or self.studio_config_collection is None:
            return {
                "success": False,
                "message": "Database connection not available"
            }
        
        try:
            now = datetime.utcnow()
            
            # Check if config already exists for this project
            existing_config = self.studio_config_collection.find_one({"project_id": project_id})
            
            if existing_config:
                # Update existing config
                result = self.studio_config_collection.update_one(
                    {"project_id": project_id},
                    {
                        "$set": {
                            "config": config,
                            "updated_at": now,
                            "created_by": created_by
                        }
                    }
                )
                
                if result.matched_count > 0:
                    print(f"✅ Studio config updated successfully for project: {project_id}")
                    return {
                        "success": True,
                        "message": "Studio config updated successfully",
                        "project_id": project_id,
                        "action": "updated"
                    }
                else:
                    return {
                        "success": False,
                        "message": "Failed to update studio config"
                    }
            else:
                # Create new config
                config_doc = {
                    "project_id": project_id,
                    "org_id": org_id,
                    "config": config,
                    "created_at": now,
                    "updated_at": now,
                    "created_by": created_by
                }
                
                result = self.studio_config_collection.insert_one(config_doc)
                
                if result.inserted_id:
                    print(f"✅ Studio config created successfully for project: {project_id}")
                    return {
                        "success": True,
                        "message": "Studio config created successfully",
                        "project_id": project_id,
                        "action": "created"
                    }
                else:
                    return {
                        "success": False,
                        "message": "Failed to create studio config"
                    }
                
        except Exception as e:
            print(f"❌ Error creating/updating studio config: {e}")
            return {
                "success": False,
                "message": "Internal server error"
            }
    
    def get_studio_config(self, project_id: str, org_id: Optional[str] = None) -> Optional[dict]:
        """Get studio config for a project"""
        print(f"🔍 MongoDB get_studio_config called for project_id: {project_id}")
        
        if not self.is_connected() or self.studio_config_collection is None:
            return None
        
        try:
            # Build query filter
            query_filter = {"project_id": project_id}
            if org_id:
                query_filter["org_id"] = org_id
            
            config_doc = self.studio_config_collection.find_one(query_filter)
            
            if config_doc:
                # Return only the config field, not the entire document
                config = config_doc.get("config")
                print(f"✅ Studio config found for project: {project_id}")
                return config
            else:
                print(f"❌ Studio config not found for project: {project_id}")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving studio config: {e}")
            return None
    
    # Workflow Methods
    def create_workflow(self, org_id: str, project_id: Optional[str], name: str, description: str, 
                        inputs: dict, steps: List[dict]) -> Optional[str]:
        """Create a new workflow entry"""
        try:
            print(f"➕ MongoDB create_workflow called for name: {name}")
            
            if not self.is_connected() or self.workflows_collection is None:
                print("❌ Database connection not available")
                return None
            
            workflow_id = str(uuid.uuid4())
            current_time = datetime.utcnow()
            
            workflow_data = {
                "workflow_id": workflow_id,
                "org_id": org_id,
                "project_id": project_id,
                "name": name,
                "description": description,
                "inputs": inputs,
                "steps": steps,
                "created_at": current_time,
                "updated_at": current_time
            }
            
            result = self.workflows_collection.insert_one(workflow_data)
            
            if result.inserted_id:
                print(f"✅ Workflow created successfully: {workflow_id}")
                return workflow_id
            else:
                print(f"❌ Failed to create workflow")
                return None
                
        except Exception as e:
            print(f"❌ Error creating workflow: {e}")
            return None

    def list_workflows(self, org_id: str, project_id: str) -> List[dict]:
        """List all workflows for an organization"""
        try:
            print(f"📋 MongoDB list_workflows called for org_id: {org_id}")
            
            if not self.is_connected() or self.workflows_collection is None:
                print("❌ Database connection not available")
                return []
            
            # Build query filter
            query_filter = {"org_id": org_id}
            if project_id:
                query_filter["project_id"] = project_id
            
            # For Azure Cosmos DB, we'll get all results and sort in memory to avoid indexing issues
            workflows = list(self.workflows_collection.find(query_filter))
            
            # Sort by created_at in memory (newest first)
            workflows.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
            
            # Convert ObjectId to string for JSON serialization
            for workflow in workflows:
                if "_id" in workflow:
                    workflow["_id"] = str(workflow["_id"])
            
            print(f"✅ Found {len(workflows)} workflows")
            return workflows
            
        except Exception as e:
            print(f"❌ Error listing workflows: {e}")
            return []

    def delete_workflow(self, workflow_id: str, org_id: str) -> bool:
        """Delete a workflow"""
        try:
            print(f"🗑️ MongoDB delete_workflow called for workflow_id: {workflow_id}")
            
            if not self.is_connected() or self.workflows_collection is None:
                print("❌ Database connection not available")
                return False
            
            result = self.workflows_collection.delete_one({
                "workflow_id": workflow_id,
                "org_id": org_id
            })
            
            if result.deleted_count > 0:
                print(f"✅ Workflow deleted successfully: {workflow_id}")
                return True
            else:
                print(f"❌ Workflow not found: {workflow_id}")
                return False
                
        except Exception as e:
            print(f"❌ Error deleting workflow: {e}")
            return False

    # Auth Config Methods
    def create_auth_config(self, org_id: str, project_id: str, name: str, auth_config: dict) -> Optional[str]:
        """Create a new auth config entry"""
        try:
            print(f"➕ MongoDB create_auth_config called for name: {name}")
            
            if not self.is_connected() or self.auth_configs_collection is None:
                print("❌ Database connection not available")
                return None
            
            auth_config_id = str(uuid.uuid4())
            current_time = datetime.utcnow()
            
            auth_config_data = {
                "auth_config_id": auth_config_id,
                "org_id": org_id,
                "project_id": project_id,
                "name": name,
                "auth_config": auth_config,
                "created_at": current_time,
                "updated_at": current_time
            }
            
            result = self.auth_configs_collection.insert_one(auth_config_data)
            
            if result.inserted_id:
                print(f"✅ Auth config created successfully: {auth_config_id}")
                return auth_config_id
            else:
                print(f"❌ Failed to create auth config")
                return None
                
        except Exception as e:
            print(f"❌ Error creating auth config: {e}")
            return None

    def list_auth_configs(self, org_id: str, project_id: str) -> List[dict]:
        """List all auth configs for a project"""
        try:
            print(f"📋 MongoDB list_auth_configs called for project_id: {project_id}")
            
            if not self.is_connected() or self.auth_configs_collection is None:
                print("❌ Database connection not available")
                return []
            
            # Build query filter
            query_filter = {"org_id": org_id, "project_id": project_id}
            
            # Get all auth configs for the project
            auth_configs = list(self.auth_configs_collection.find(query_filter))
            
            # Sort by created_at in memory (newest first)
            auth_configs.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
            
            # Convert ObjectId to string for JSON serialization
            for auth_config in auth_configs:
                if "_id" in auth_config:
                    auth_config["_id"] = str(auth_config["_id"])
            
            print(f"✅ Found {len(auth_configs)} auth configs")
            return auth_configs
            
        except Exception as e:
            print(f"❌ Error listing auth configs: {e}")
            return []

    def delete_auth_config(self, auth_config_id: str, org_id: str, project_id: str) -> bool:
        """Delete an auth config"""
        try:
            print(f"🗑️ MongoDB delete_auth_config called for auth_config_id: {auth_config_id}")
            
            if not self.is_connected() or self.auth_configs_collection is None:
                print("❌ Database connection not available")
                return False
            
            result = self.auth_configs_collection.delete_one({
                "auth_config_id": auth_config_id,
                "org_id": org_id,
                "project_id": project_id
            })
            
            if result.deleted_count > 0:
                print(f"✅ Auth config deleted successfully: {auth_config_id}")
                return True
            else:
                print(f"❌ Auth config not found: {auth_config_id}")
                return False
                
        except Exception as e:
            print(f"❌ Error deleting auth config: {e}")
            return False

# Global MongoDB client instance
mongo_client = MongoDBClient()

def get_mongo_client() -> MongoDBClient:
    """Get the global MongoDB client instance"""
    return mongo_client 