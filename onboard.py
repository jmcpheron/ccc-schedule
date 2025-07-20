#!/usr/bin/env python3
"""
CCC Schedule Onboarding Tool

Easy entry point for college onboarding using the LLM-enhanced system.
"""

import sys
from pathlib import Path

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent))

from src.onboarding_cli import main

if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║         CCC Schedule - College Onboarding System         ║
    ║                                                          ║
    ║  Welcome! This tool will help you integrate your        ║
    ║  college's schedule data into the CCC Schedule system.   ║
    ║                                                          ║
    ║  • No coding required                                    ║
    ║  • Intelligent data extraction                           ║
    ║  • Works with any schedule format                       ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    main()