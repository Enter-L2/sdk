#!/usr/bin/env python3

from setuptools import setup, find_packages
import os

# Read the README file
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

# Read requirements
with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

# Read version
version = {}
with open("enterl2/__version__.py", "r", encoding="utf-8") as fh:
    exec(fh.read(), version)

setup(
    name="enterl2-sdk",
    version=version["__version__"],
    author="Enter L2 Team",
    author_email="dev@enterl2.com",
    description="Python SDK for Enter L2 - ZK Rollup stablecoin payment network",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/enter-l2/sdk",
    project_urls={
        "Bug Tracker": "https://github.com/enter-l2/sdk/issues",
        "Documentation": "https://docs.enterl2.com",
        "Source Code": "https://github.com/enter-l2/sdk",
    },
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Office/Business :: Financial",
        "Topic :: Security :: Cryptography",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "sphinx>=6.0.0",
            "sphinx-rtd-theme>=1.2.0",
        ],
        "test": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "enterl2=enterl2.cli:main",
        ],
    },
    include_package_data=True,
    package_data={
        "enterl2": [
            "abi/*.json",
            "py.typed",
        ],
    },
    keywords=[
        "enterl2",
        "enter-l2", 
        "zk-rollup",
        "layer2",
        "ethereum",
        "stablecoin",
        "payments",
        "blockchain",
        "web3",
        "defi",
    ],
    zip_safe=False,
)
