#!/usr/bin/python3
import json
import os
import sys
import subprocess

class BackgroundColor:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def compileToAssembly(testcaseNumber, inputFile, outputFile):
    print(f"[*] Compiling to assembly for testcase: {testcaseNumber}")
    p = subprocess.run(["node", "../index.js", f"{inputFile}", "-o", f"{outputFile}"])
    if (p.returncode != 0):
        print(f"{BackgroundColor.BOLD}{BackgroundColor.FAIL}[❌] Compiling to assembly failed for testcase: {testcaseNumber}{BackgroundColor.ENDC}")
        sys.exit(1)
    print(f"[✔] Compilation finished for testcase: {testcaseNumber}")

def compileToExecutableDirectly(testcaseNumber, inputFile, outputFile):
    p = subprocess.run(["gcc", f"{inputFile}", "-o", f"{outputFile}"])
    if (p.returncode != 0):
        print(f"{BackgroundColor.BOLD}{BackgroundColor.FAIL}[❌] Compiling to executable failed using gcc for testcase: {testcaseNumber}{BackgroundColor.ENDC}")
        sys.exit(1)

def compileToExecutableUsingJccOutputAssembly(testcaseNumber, inputFile, outputFile):
    p = subprocess.run(["gcc", f"{inputFile}", "-o", f"{outputFile}"])
    if (p.returncode != 0):
        print(f"{BackgroundColor.BOLD}{BackgroundColor.FAIL}[❌] Compiling to executable failed using assembly generated by jcc for testcase: {testcaseNumber}{BackgroundColor.ENDC}")
        sys.exit(1)

def runExecutablesAndCompareResults(testcaseNumber, executableFromJccAssembly, executableFromGccDirectly):
    p1 = subprocess.run([f"{executableFromJccAssembly}"])
    p2 = subprocess.run([f"{executableFromGccDirectly}"])
    if (p1.returncode != p2.returncode):
        print(f"{BackgroundColor.BOLD}{BackgroundColor.FAIL}[❌] Test case failed: #{testcaseNumber}{BackgroundColor.ENDC}")
        sys.exit(1)
    else:
        print(f"{BackgroundColor.BOLD}{BackgroundColor.OKGREEN}[✔] Test case passed: #{testcaseNumber}{BackgroundColor.ENDC}")

def runValidTestCase(testcase):
    inputFile = testcase['inputFile']
    outputAssemblyFile = testcase['outputFileJcc']
    testcaseNumber = testcase['testCaseNumber']
    executableGcc = testcase['executableGcc']
    executableJcc = testcase['executableJcc']
    compileToAssembly(testcaseNumber, inputFile, outputAssemblyFile)
    compileToExecutableDirectly(testcaseNumber, inputFile, executableGcc)
    compileToExecutableUsingJccOutputAssembly(testcaseNumber, outputAssemblyFile, executableJcc)
    runExecutablesAndCompareResults(testcaseNumber, executableJcc, executableGcc)

if __name__ == "__main__":
    testcaseFile = open('./testdata.json')
    data = json.load(testcaseFile)
    for stage in data:
        print(f"{BackgroundColor.BOLD}{BackgroundColor.OKBLUE}Running suite for stage: {stage}...{BackgroundColor.ENDC}")
        testsArray = data[stage]
        for testcase in testsArray:
            # Run test
            runValidTestCase(testcase)
        print(f"{BackgroundColor.BOLD}{BackgroundColor.OKBLUE}Test suite for stage: {stage} finished...{BackgroundColor.ENDC}")