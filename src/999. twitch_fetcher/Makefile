# Set up the virtual environment using Poetry
setup:
	poetry install

# Run the Python script
run:
	poetry run python fetch.py

# Update the dependencies
update:
	poetry update

# Clean the project (like removing the virtual environment)
clean:
	poetry env remove python3

# Fetch game IDs and clips, then check for faces
all: setup run

