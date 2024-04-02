---
title: Basic Windows Installer
description: This tutorial covers how to use "Inno Setup" to create professional looking installers for Windows programs.
---

Writing an installer for Windows isn't that easy and, at this time, definitely out of the scope of the bell0bytes
tutorials. There exists, however, a proven software, [Inno Setup](http://jrsoftware.org/isinfo.php), to create
installers without having to do a lot of scripting.

[Inno Setup](http://jrsoftware.org/isinfo.php) is a free (open-source licence) installer for Windows programs, developed
by Jordan Russell and Martijn Laan. First introduced in 1997, Inno Setup today rivals and even surpasses many commercial
installers in feature set and stability. The best thing is that to create a basic installer, no scripting is necessary
at all, as Inno Setup comes with a graphical wizard that can handle basic installers surprisingly well.

## You are not prepared!

Before creating the installer, the game executable, eventual *dll*s and all game data must be collected. I have my
Visual Studio projects set up in such a way that the game executable is in a subfolder called *x64* and all game data is
in subfolders on the same level, usually called *Data* with different subfolders for art and music, such as
*Data\Artwork* and *Data\Audio*.

Once all the data is in place, we can start the graphical wizard of Inno Setup.

## The Graphical Wizard

When Inno Setup starts, the graphical wizard pops up automatically.

Chose *Simple Script* and click on *ok*. On the next screen, you can simply click *Next*. On the next screen we can to
enter basic data about our game.

Fill out the information and click *Next*. On the following screen you can choose the default installation directory,
the default settings are usually fine.

Click *Next*. Now on the following screen we chose our game files. The **application main executable file** is usually
the *.exe*-file created by Visual Studio, in this case that would be `svh.exe`. Make sure to also add all the *dll*s you
need, by using the *Add file(s)* button.

Now to add the game data, click the *Add folder* button to add the data folder and all its subdirectories.

**Note** that if you want some files or data to be installed in different subfolders, you can click on them and then
click the *Edit* button. In the box that appears you can select specific subfolders.

Don't worry if you forget to select the subdirectories, they can easily be changed later on when reviewing the script
created by the graphical wizard.

For now, once satisfied, click *Next*. On the next screen you can fine-tune a few settings, such as allowing the user to
create a start menu entry or a shortcut on the desktop.

Once you have selected all the options you want, click *Next*.

On the next screen you can select a *Licence* file to be shown to the user, and two files to be shown before,
respectively after the installation. You can use this to show a *readme* file, for example.

Once again, click *Next*. On the next screen, you can select all the languages the installer should be available in.
Pick whatever languages you like or deem necessary.

Click *Next*. During the next step, you can customize the output, i.e. where Inno Setup will store the installer or
setup file it creates for us. You can also specify the name of the installer, in this example that would be
*SvH_Installer*. One can also add a custom icon for the installer, I chose the little barking dog as seen on the
bell0bytes website.

Click *Next* and on the following screen click *Next* again. Then click *Finish*. When asked if you want to compile the
script *now*, click *No*.

You will now see the script the Inno Setup wizard created for us.

You can add some finishing touches to the script, for example, we want the main executable file and its *dll* to be
installed in a subfolder called *x64*. To do so, we simply add *\x64* to the destination directory of both files
under [Files], as follows:

```
[Files]
Source: "O:\Downloads\Test\SvH\x64\Stécker vum Himmel.exe"; DestDir: "{app}\x64"; Flags: ignoreversion
Source: "O:\Downloads\Test\SvH\x64\lua53.dll"; DestDir: "{app}\x64"; Flags: ignoreversion
Source: "O:\Downloads\Test\SvH\Data\*"; DestDir: "{app}\Data"; Flags: ignoreversion recursesubdirs createallsubdirs
```

Since we moved the executable file to a new subdirectory, we also have to update the *run* command and the *create
desktop shortcut* command to reflect those changes:

```
[Icons]
...
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\x64\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\x64\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
```

Last but not least, you can also change the directory structure for the *Start Menu* entry, for example:

```
[Setup]
...
DefaultDirName={pf}\bell0bytes/Stécker vum Himmel
DefaultGroupName=bell0bytes/Stécker vum Himmel
```

And that's it already. Now simply navigate to *Project->Compile* and Inno Setup will create the installer file.

---

Have fun!

---

## References

* [Inno Setup](http://jrsoftware.org/isinfo.php)
* [Martin Klappacher](http://martin-klappacher.com/)
