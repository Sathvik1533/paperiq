import pathlib, sys
# Path to the actual FastAPI app code
app_path = pathlib.Path(__file__).parent / "app"
# Insert the app path so that imports like `backend.app.utils` resolve correctly
if str(app_path) not in sys.path:
    sys.path.insert(0, str(app_path))
# Make this a namespace package exposing the `app` submodule
__path__ = [str(app_path)]
