package main

import (
	"flag"
	"fmt"
	"os"

	"devflow/internal/mcp"
)

func main() {
	urlFlag := flag.String("url", os.Getenv("DEVFLOW_URL"), "DevFlow Base API URL (e.g. https://devflow.skrinvex.com)")
	tokenFlag := flag.String("token", os.Getenv("DEVFLOW_TOKEN"), "DevFlow User Bearer JWT Token")
	flag.Parse()

	if *urlFlag == "" {
		*urlFlag = "http://localhost:1451"
	}

	if *tokenFlag == "" {
		fmt.Fprintln(os.Stderr, "Error: DEVFLOW_TOKEN is required. Pass --token or set DEVFLOW_TOKEN environment variable.")
		os.Exit(1)
	}

	server := mcp.NewServer(*urlFlag, *tokenFlag)
	if err := server.RunStdio(); err != nil {
		fmt.Fprintf(os.Stderr, "MCP server error: %v\n", err)
		os.Exit(1)
	}
}
