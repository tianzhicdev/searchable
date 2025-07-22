# Routes package
# Import all route modules to register them with Flask-RESTX

from . import auth
from . import payment  
from . import searchable
from . import files
from . import withdrawals
from . import metrics
from . import profiles
from . import media
from . import tags
from . import deposits
from . import ai_content
from . import feedback

# This ensures all routes are registered when the package is imported
__all__ = ['auth', 'payment', 'searchable', 'files', 'withdrawals', 'metrics', 'profiles', 'media', 'tags', 'deposits', 'ai_content', 'feedback'] 