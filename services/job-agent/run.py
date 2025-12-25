#!/usr/bin/env python3
"""
Convenience script to run the Job Agent API server.

Usage:
    python run.py
    python run.py --host 0.0.0.0 --port 8000
    python run.py --reload

Author: Backend API Designer
"""

import argparse
import sys
from pathlib import Path

# Ensure the service directory is in the path
SERVICE_DIR = Path(__file__).parent
sys.path.insert(0, str(SERVICE_DIR))


def main():
    """Run the FastAPI server with uvicorn."""
    parser = argparse.ArgumentParser(
        description="Run the Job Agent API server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python run.py                    # Start with default settings
    python run.py --port 8080        # Use different port
    python run.py --no-reload        # Disable auto-reload
    python run.py --host 0.0.0.0     # Listen on all interfaces
        """
    )

    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Host to bind to (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind to (default: 8000)"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        default=True,
        help="Enable auto-reload (default: True)"
    )
    parser.add_argument(
        "--no-reload",
        action="store_true",
        help="Disable auto-reload"
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="info",
        choices=["debug", "info", "warning", "error", "critical"],
        help="Log level (default: info)"
    )

    args = parser.parse_args()

    # Handle reload flag
    reload_enabled = args.reload and not args.no_reload

    try:
        import uvicorn
    except ImportError:
        print("Error: uvicorn is not installed.")
        print("Install it with: pip install uvicorn[standard]")
        sys.exit(1)

    print("="*60)
    print("Starting Job Agent API Server")
    print("="*60)
    print(f"  Host:       {args.host}")
    print(f"  Port:       {args.port}")
    print(f"  Reload:     {reload_enabled}")
    print(f"  Log Level:  {args.log_level}")
    print("="*60)
    print()
    print(f"API:         http://{args.host}:{args.port}")
    print(f"Swagger UI:  http://{args.host}:{args.port}/docs")
    print(f"ReDoc:       http://{args.host}:{args.port}/redoc")
    print()
    print("="*60)
    print()

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=reload_enabled,
        log_level=args.log_level,
    )


if __name__ == "__main__":
    main()
