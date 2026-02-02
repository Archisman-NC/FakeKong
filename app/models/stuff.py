from datetime import datetime, timedelta
import hashlib
import secrets

class ApiClient:
    """represents an api client with their status and stuff"""
    
    def __init__(self, id=None, name=None, email=None, status='active', 
                 created_at=None, updated_at=None):
        self.id = id
        self.name = name
        self.email = email
        self.status = status
        self.created_at = created_at or datetime.utcnow().isoformat()
        self.updated_at = updated_at or datetime.utcnow().isoformat()
    
    def is_blocked(self):
        return self.status == 'blocked'
    
    def block_it(self):
        """block this client"""
        self.status = 'blocked'
        self.updated_at = datetime.utcnow().isoformat()
    
    def unblock_it(self):
        """unblock and make active again"""
        self.status = 'active'
        self.updated_at = datetime.utcnow().isoformat()
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'status': self.status,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_row(row):
        """create from db row"""
        if row is None:
            return None
        return ApiClient(
            id=row['id'],
            name=row['name'],
            email=row['email'],
            status=row['status'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )


class ApiKey:
    """api key with expiry and revoke logic"""
    
    def __init__(self, id=None, client_id=None, key_hash=None, key_prefix=None,
                 is_active=True, expires_at=None, created_at=None, revoked_at=None):
        self.id = id
        self.client_id = client_id
        self.key_hash = key_hash
        self.key_prefix = key_prefix
        self.is_active = is_active
        self.expires_at = expires_at
        self.created_at = created_at or datetime.utcnow().isoformat()
        self.revoked_at = revoked_at
    
    def has_expired(self):
        """check if key expired"""
        if not self.expires_at:
            return False
        expiry = datetime.fromisoformat(self.expires_at)
        return datetime.utcnow() > expiry
    
    def is_valid(self):
        """check if key can be used"""
        return self.is_active and not self.has_expired() and not self.revoked_at
    
    def revoke_it(self):
        """revoke this key"""
        self.is_active = False
        self.revoked_at = datetime.utcnow().isoformat()
    
    def check_hash(self, raw_key):
        """verify raw key against stored hash"""
        test_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        return test_hash == self.key_hash
    
    @staticmethod
    def generate_key():
        """make a new random api key"""
        return 'fk_' + secrets.token_urlsafe(32)
    
    @staticmethod
    def hash_key(raw_key):
        """hash the key for storage"""
        return hashlib.sha256(raw_key.encode()).hexdigest()
    
    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'key_prefix': self.key_prefix,
            'is_active': self.is_active,
            'expires_at': self.expires_at,
            'created_at': self.created_at,
            'revoked_at': self.revoked_at
        }
    
    @staticmethod
    def from_row(row):
        if row is None:
            return None
        return ApiKey(
            id=row['id'],
            client_id=row['client_id'],
            key_hash=row['key_hash'],
            key_prefix=row['key_prefix'],
            is_active=bool(row['is_active']),
            expires_at=row['expires_at'],
            created_at=row['created_at'],
            revoked_at=row['revoked_at']
        )


class RateLimitRule:
    """rate limit config with refill calculations"""
    
    def __init__(self, id=None, client_id=None, endpoint_pattern=None,
                 max_requests=100, window_seconds=60, created_at=None):
        self.id = id
        self.client_id = client_id
        self.endpoint_pattern = endpoint_pattern or '*'
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.created_at = created_at or datetime.utcnow().isoformat()
    
    def get_refill_rate(self):
        """tokens per second"""
        return self.max_requests / self.window_seconds
    
    def calc_refill(self, last_refill_time):
        """calculate how many tokens to add based on time passed"""
        last_time = datetime.fromisoformat(last_refill_time)
        now = datetime.utcnow()
        elapsed = (now - last_time).total_seconds()
        return elapsed * self.get_refill_rate()
    
    def matches_endpoint(self, endpoint):
        """check if this rule applies to endpoint"""
        if self.endpoint_pattern == '*':
            return True
        return endpoint.startswith(self.endpoint_pattern)
    
    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'endpoint_pattern': self.endpoint_pattern,
            'max_requests': self.max_requests,
            'window_seconds': self.window_seconds,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_row(row):
        if row is None:
            return None
        return RateLimitRule(
            id=row['id'],
            client_id=row['client_id'],
            endpoint_pattern=row['endpoint_pattern'],
            max_requests=row['max_requests'],
            window_seconds=row['window_seconds'],
            created_at=row['created_at']
        )


class UsageLog:
    """immutable usage event record"""
    
    def __init__(self, id=None, client_id=None, api_key_id=None, endpoint=None,
                 method=None, status_code=None, latency_ms=None, timestamp=None,
                 ip_address=None, user_agent=None):
        self.id = id
        self.client_id = client_id
        self.api_key_id = api_key_id
        self.endpoint = endpoint
        self.method = method
        self.status_code = status_code
        self.latency_ms = latency_ms
        self.timestamp = timestamp or datetime.utcnow().isoformat()
        self.ip_address = ip_address
        self.user_agent = user_agent
    
    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'api_key_id': self.api_key_id,
            'endpoint': self.endpoint,
            'method': self.method,
            'status_code': self.status_code,
            'latency_ms': self.latency_ms,
            'timestamp': self.timestamp,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent
        }
    
    @staticmethod
    def from_row(row):
        if row is None:
            return None
        return UsageLog(
            id=row['id'],
            client_id=row['client_id'],
            api_key_id=row['api_key_id'],
            endpoint=row['endpoint'],
            method=row['method'],
            status_code=row['status_code'],
            latency_ms=row['latency_ms'],
            timestamp=row['timestamp'],
            ip_address=row.get('ip_address'),
            user_agent=row.get('user_agent')
        )
