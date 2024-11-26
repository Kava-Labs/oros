package main

import (
	"fmt"
	"log"
	"os"
)

func main() {
	if os.Getenv("OPENAI_API_KEY") == "" {
		log.Fatal("OPENAI_API_KEY is required")
	}

	fmt.Println("Welcome to the Kavachat API!")
}
