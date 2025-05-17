@echo off
setlocal enabledelayedexpansion

echo === Mar System GitHub Repository Reset and Push Script ===
echo This script will reset your existing GitHub repository and push the new code.
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Git is not installed. Please install Git first.
    exit /b 1
)

REM Initialize git if not already done
if not exist .git (
    echo === Initializing Git repository... ===
    git init
    echo === Git repository initialized ===
) else (
    echo === Git repository already exists ===
)

echo === Setting up remote to your existing repository... ===
git remote add origin https://github.com/omaralhami/mar-system.git 2>nul
git remote set-url origin https://github.com/omaralhami/mar-system.git 2>nul
echo === Remote set to https://github.com/omaralhami/mar-system.git ===

echo.
echo === WARNING: This will reset your existing GitHub repository! ===
echo All content in https://github.com/omaralhami/mar-system will be replaced.
echo.
echo Are you sure you want to continue? (y/n)
set /p confirm=

if /i not "!confirm!"=="y" (
    echo Operation cancelled.
    exit /b 0
)

echo.
echo === Creating an orphan branch... ===
git checkout --orphan temp_branch

echo === Adding all files... ===
git add .

echo === Committing changes... ===
git commit -m "Initial commit: Mar System Discord Bot"

echo === Deleting the main branch... ===
git branch -D main 2>nul
git branch -D master 2>nul

echo === Renaming temp branch to main... ===
git branch -m main

echo === Force pushing to GitHub... ===
echo Note: You might be prompted for your GitHub credentials
git push -f origin main

echo.
echo === Repository reset complete! ===
echo Your Mar System Discord Bot is now on GitHub with a clean history.
echo.
echo Don't forget to:
echo   1. Check your repository on GitHub
echo   2. Update the .env file with your actual bot token (locally only)
echo   3. Follow the deployment instructions in DEPLOYMENT.md
echo.

pause 