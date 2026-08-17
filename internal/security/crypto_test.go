package security

import (
	"testing"
)

func TestAESGCMEncryptionAndDecryption(t *testing.T) {
	key := []byte("super_secret_master_key_32bytes_long!")
	plaintext := "sk-proj-super-secret-openai-api-key-9988776655"

	encrypted, err := EncryptAESGCM(plaintext, key)
	if err != nil {
		t.Fatalf("encryption failed: %v", err)
	}

	if encrypted == plaintext {
		t.Fatalf("expected encrypted text to differ from plaintext")
	}

	decrypted, err := DecryptAESGCM(encrypted, key)
	if err != nil {
		t.Fatalf("decryption failed: %v", err)
	}

	if decrypted != plaintext {
		t.Fatalf("expected %q, got %q", plaintext, decrypted)
	}

	// Test unencrypted fallback
	unencrypted := "plain unencrypted text"
	unencResult, err := DecryptAESGCM(unencrypted, key)
	if err != nil {
		t.Fatalf("fallback decryption failed: %v", err)
	}
	if unencResult != unencrypted {
		t.Fatalf("expected unencrypted text preserved, got %q", unencResult)
	}
}
