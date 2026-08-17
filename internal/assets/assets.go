package assets

import (
	"embed"
	"io/fs"
)

//go:embed all:dist
var embeddedFS embed.FS

// GetWebFS returns the sub filesystem pointing to the compiled web assets
func GetWebFS() fs.FS {
	sub, err := fs.Sub(embeddedFS, "dist")
	if err != nil {
		return embeddedFS
	}
	return sub
}
