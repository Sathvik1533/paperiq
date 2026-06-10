import pathlib

# Make this package point to the actual implementation under backend/app
__path__ = [str(pathlib.Path(__file__).parent.parent / "backend" / "app")]
