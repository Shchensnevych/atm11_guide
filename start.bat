@echo off
rem ATM11 guide: local preview at http://localhost:8811
rem   start.bat          - menu
rem   start.bat 1        - just open the site
rem   start.bat 2 / keys - update keybinds from minecraft\options.txt (extract_keys + build_data), then open
rem   start.bat 3 / save - update progress from minecraft\saves (extract_progress + build_data), then open
rem                        Note: make sure the game has saved the world (exit to main menu or autosave).
rem Server: real Python if installed, otherwise PowerShell (tools\serve.ps1, built into Windows).
cd /d "%~dp0"
set "PY="
python -c "import sys" >nul 2>nul
if not errorlevel 1 set "PY=python"
if defined PY goto havepy
py -3 -c "import sys" >nul 2>nul
if not errorlevel 1 set "PY=py -3"
:havepy
set "CH=%~1"
if not "%CH%"=="" goto choice
echo.
echo   1 - open the guide
echo   2 - update keybinds from options.txt, then open
echo   3 - update progress from save (save world / exit to main menu first), then open
echo.
set /p "CH=Choice [1]: "
:choice
if "%CH%"=="2" set "CH=keys"
if "%CH%"=="3" set "CH=save"
if /i "%CH%"=="progress" set "CH=save"
if /i "%CH%"=="keys" goto dokeys
if /i "%CH%"=="save" goto dosave
goto serve
:dokeys
if not defined PY goto nopy
%PY% -I -X utf8 tools\extract_keys.py
if errorlevel 1 goto fail
%PY% -I -X utf8 tools\build_data.py
if errorlevel 1 goto fail
goto serve
:dosave
if not defined PY goto nopy
echo Note: reading world save from minecraft\saves (exit to main menu or wait for autosave for latest data).
%PY% -I -X utf8 tools\extract_progress.py
if errorlevel 1 goto fail
%PY% -I -X utf8 tools\build_data.py
if errorlevel 1 goto fail
goto serve
:nopy
echo Python 3 is not installed - cannot rebuild data here.
echo Use the button "Load your options.txt" on the Keys tab instead.
pause
goto serve
:fail
echo Update failed - see messages above.
pause
:serve
if not defined PY goto ps
start "" http://localhost:8811/
cd /d "%~dp0docs"
%PY% -m http.server 8811
goto end
:ps
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1" -Root "%~dp0docs" -Port 8811
:end
echo Server stopped.
pause
