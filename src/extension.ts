import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand(
		"extension.runDjangoCommand",
		async () => {
			const workspaceFolders = vscode.workspace.workspaceFolders;

			if (!workspaceFolders) {
				vscode.window.showErrorMessage(
					"No workspace folder found. Open a Django project first."
				);
				return;
			}

			// Search for manage.py in the workspace
			const workspacePath = workspaceFolders[0].uri.fsPath;
			const managePyPath = findManagePy(workspacePath);

			if (!managePyPath) {
				vscode.window.showErrorMessage(
					"manage.py not found in the project."
				);
				return;
			}

			const manageDir = path.dirname(managePyPath);

			// Ask the user to select a command
			const command = await vscode.window.showQuickPick(
				[
					"Run Server",
					"Make Migrations",
					"Apply Migrations",
					"Open Shell",
				],
				{ placeHolder: "Select a Django command" }
			);

			if (!command) return; // User cancelled

			let djangoCommand = "";
			switch (command) {
				case "Run Server":
					djangoCommand = "runserver";
					break;
				case "Make Migrations":
					djangoCommand = "makemigrations";
					break;
				case "Apply Migrations":
					djangoCommand = "migrate";
					break;
				case "Open Shell":
					djangoCommand = "shell";
					break;
			}

			const terminal = vscode.window.createTerminal("Django Terminal");
			terminal.show();
			terminal.sendText(
				`cd "${manageDir}" && python manage.py ${djangoCommand}`
			);
		}
	);

	// Status bar button
	let button = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Left,
		100
	);
	button.text = "$(play) Django Commands";
	button.command = "extension.runDjangoCommand";
	button.show();

	context.subscriptions.push(disposable, button);
}

// Function to find manage.py in the workspace
function findManagePy(dir: string): string | null {
	let files = fs.readdirSync(dir);
	if (files.includes("manage.py")) {
		return path.join(dir, "manage.py");
	}

	// Search recursively in subdirectories (1 level deep)
	for (let subDir of files) {
		let fullPath = path.join(dir, subDir);
		if (fs.statSync(fullPath).isDirectory()) {
			let subManagePy = path.join(fullPath, "manage.py");
			if (fs.existsSync(subManagePy)) {
				return subManagePy;
			}
		}
	}

	return null;
}

export function deactivate() {}
