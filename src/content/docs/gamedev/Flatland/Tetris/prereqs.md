---
title: Installing Prerequisites
description: In this tutorial, an Inno Studio script, written in Pascal, to check for and to install the Visual C++ 2017 Redistributables, if required, is developed and explained.
---

In the previous tutorial, we learned how to use *[Inno Setup](http://www.jrsoftware.org/isinfo.php)* to create a basic
installer for Windows programs. In this tutorial, we will learn how to install prerequisite software, if necessary.

As an example, we will add a check to install the Visual C++ 2017 Redistributable to the previous *Stécker vum Himmel*
installer.

## The Runtime Library Installer

The latest Visual C++ 2017 Redistributable installer can be downloaded from
the [official Microsoft website](https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads).

## Scripting

### Adding the Installer

The first thing to do is to add the installer file to the Inno Setup script. By now you should be familiar with the
scripting language, and thus this step is straightforward. I copied the installer into the *tmp* subdirectory:

```
[Files]
Source: "O:\Downloads\SvH\tmp\vc_redist.x64.exe"; DestDir: {tmp}; Flags: deleteafterinstall

Source: "O:\Downloads\SvH\x64\Stécker vum Himmel.exe"; DestDir: "{app}\x64"; Flags: ignoreversion
Source: "O:\Downloads\SvH\Data\*"; DestDir: "{app}\Data"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "O:\Downloads\SvH\x64\lua53.dll"; DestDir: "{app}\x64"; Flags: ignoreversion
```

#### DestDir

The *{tmp}* destination directory means that the file will be extracted into the temporary folder on the user's
computer.

#### Flags

The *deleteafterinstall* flag states that the Visual C++ 2017 Redistributable-installer will be deleted after the
runtimes are installed.

### Running the Installer

To run the installer, we have to add another simple line of code to Inno Setup-script:

```
[RUN]
Filename: "{tmp}\vc_redist.x64.exe"; Check: VCRedistNeedsInstall; StatusMsg: Installing Visual Studio Runtime Libraries...
Filename: "{app}\x64\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
```

Once again notice that the *exe* is installed in the users temporary folder.

#### Check

The *Check* parameter is the name of a function that is to be called and evaluated before the *exe* is run. We will see
the code of that function shortly, for now, it just matters to know that the *vc_redist.x64.exe* will only be run if the
*check*-function returns true.

#### StatusMsg

The *StatusMsg* parameter contains the text that Inno Setup will display as the Visual Studio runtimes are being
installed.

## Pascal

Welcome back to the good old times! An Inno Setup-script can contain Pascal code. We will write a simple script to check
whether the Visual C++ 2017 Redistributables are already installed or not.

### Unique IDs

As we learned way back in a previous tutorial, each Windows program has a unique ID, thus to check whether the Visual
C++ 2017 Redistributables are installed or not, we simply query whether software with a given ID is registered in the
registry or not. The ID for the latest Visual C++ 2017 Redistributables are as follows:

```pascal
const
  { Visual C++ 2017 Redistributable 14.16.27024 }
  VC_2017_REDIST_X84_ADD = '{7258184A-EC44-4B1A-A7D3-68D85A35BFD0}';
  VC_2017_REDIST_X84_MIN = '{5EEFCEFB-E5F7-4C82-99A5-813F04AA4FBD}';

  VC_2017_REDIST_X64_ADD = '{9D29FC96-9EEE-4253-943F-96B3BBFDD0B6}';
  VC_2017_REDIST_X64_MIN = '{F1B0FB3A-E0EA-47A6-9383-3650655403B0}';
```

You can find product codes for other Visual Studio versions in the registry
under `"HKEY_CLASSES_ROOT\Installer\Dependencies"`; for
example `"HKEY_CLASSES_ROOT\Installer\Dependencies\Microsoft.VS.VC_RuntimeMinimumVSU_x86,v14"`.

### Installation State

To query the installation state of a certain program, Microsoft offers the
*[MsiQueryProductState](https://docs.microsoft.com/en-us/windows/desktop/api/msi/nf-msi-msiqueryproductstatea)*
function:

```cpp
INSTALLSTATE MsiQueryProductStateA(
  LPCSTR szProduct
);
```

The parameter for the function, a long pointer to a constant string, specifies the product code that identifies the
product to be queried.

The return value is one of the following:

|          Value          |                     Meaning                      |
|:-----------------------:|:------------------------------------------------:|
|   INSTALLSTATE_ABSENT   |  The product is installed for a different user.  |
| INSTALLSTATE_ADVERTISED |   The product is advertised but not installed.   |
|  INSTALLSTATE_DEFAULT   |  The product is installed for the current user.  |
| INSTALLSTATE_INVALIDARG | An invalid parameter was passed to the function. |
|  INSTALLSTATE_UNKNOWN   | The product is neither advertised or installed.  |

To use this function inside our Inno Setup-script, we first define the return values as constant variables:

```pascal
[Code]
  type
  INSTALLSTATE = Longint;

  const
  INSTALLSTATE_INVALIDARG = -2;  { An invalid parameter was passed to the function. }
  INSTALLSTATE_UNKNOWN = -1;     { The product is neither advertised or installed. }
  INSTALLSTATE_ADVERTISED = 1;   { The product is advertised but not installed. }
  INSTALLSTATE_ABSENT = 2;       { The product is installed for a different user. }
  INSTALLSTATE_DEFAULT = 5;      { The product is installed for the current user. }

  { Visual C++ 2017 Redistributable 14.16.27024 }
  VC_2017_REDIST_X84_ADD = '{7258184A-EC44-4B1A-A7D3-68D85A35BFD0}';
  VC_2017_REDIST_X84_MIN = '{5EEFCEFB-E5F7-4C82-99A5-813F04AA4FBD}';

  VC_2017_REDIST_X64_ADD = '{9D29FC96-9EEE-4253-943F-96B3BBFDD0B6}';
  VC_2017_REDIST_X64_MIN = '{F1B0FB3A-E0EA-47A6-9383-3650655403B0}';
```

Once done, we can embed the Windows function into a pascal function as follows:

```pascal
function MsiQueryProductState(szProduct: string): INSTALLSTATE; 
    external 'MsiQueryProductState{#AW}@msi.dll stdcall';
```

The *{#AW}* directive makes sure that the code works with unicode and ANSI version of Inno Setup:

```
#IFDEF UNICODE
  #DEFINE AW "W"
#ELSE
  #DEFINE AW "A"
#ENDIF
```

Now all that is left to do is to call the Windows function, embedded in a Pascal function, to check whether the Visual
C++ 2017 Redistributables are installed or not:

```pascal
function VCVersionInstalled(const ProductID: string): Boolean;
begin
  Result := MsiQueryProductState(ProductID) = INSTALLSTATE_DEFAULT;
end;

    function VCRedistNeedsInstall: Boolean;
begin
  Result := not VCVersionInstalled(VC_2017_REDIST_X64_MIN);
end;
```

Remember, when we added the installation file for the Visual C++ Redistributables, we added a *Check* parameter:
*VCRedistNeedsInstall*. Now before the installation starts, the function *VCRedistNeedsInstall* is called, which in turn
calls the *VCVersionInstalled* function, which uses the function defined by Windows to check whether the software we are
querying for is installed or not.

If, and only if, the function *VCRedistNeedsInstall* returns true, that is, if the prerequisite software is not
installed, *Inno Setup* runs the installer for the requested software.

---

Here is the entire code at once:

```pascal
...
type
  INSTALLSTATE = Longint;

  const
  INSTALLSTATE_INVALIDARG = -2;  { An invalid parameter was passed to the function. }
  INSTALLSTATE_UNKNOWN = -1;     { The product is neither advertised or installed. }
  INSTALLSTATE_ADVERTISED = 1;   { The product is advertised but not installed. }
  INSTALLSTATE_ABSENT = 2;       { The product is installed for a different user. }
  INSTALLSTATE_DEFAULT = 5;      { The product is installed for the current user. }

  { Visual C++ 2017 Redistributable 14.16.27024 }
  VC_2017_REDIST_X84_ADD = '{7258184A-EC44-4B1A-A7D3-68D85A35BFD0}';
  VC_2017_REDIST_X84_MIN = '{5EEFCEFB-E5F7-4C82-99A5-813F04AA4FBD}';

  VC_2017_REDIST_X64_ADD = '{9D29FC96-9EEE-4253-943F-96B3BBFDD0B6}';
  VC_2017_REDIST_X64_MIN = '{F1B0FB3A-E0EA-47A6-9383-3650655403B0}';

function MsiQueryProductState(szProduct: string): INSTALLSTATE; 
  external 'MsiQueryProductState{#AW}@msi.dll stdcall';

function VCVersionInstalled(const ProductID: string): Boolean;
begin
  Result := MsiQueryProductState(ProductID) = INSTALLSTATE_DEFAULT;
end;

function VCRedistNeedsInstall: Boolean;
begin
  Result := not VCVersionInstalled(VC_2017_REDIST_X64_MIN);
end;
```

---

Happy installing!

---

## References

* [Stack Overflow](https://stackoverflow.com/questions/11137424/how-to-make-vcredist-x86-reinstall-only-if-not-yet-installed)
* [Microsoft](https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads)