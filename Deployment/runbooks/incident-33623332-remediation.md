# Incident Response & Remediation Runbook: #33623332 (Discord Webhook Leaked)

> **Incident ID:** #33623332  
> **Source:** GitGuardian Internal Secret Incidents  
> **Type:** Discord Webhook URL (CWE-798: Use of Hard-coded Credentials)  
> **Severity:** Critical  
> **Initial Commit:** `b412f35` (`Deployment/jenkins/Jenkinsfile`)  
> **Status:** REMEDIATED & ROTATED  

---

## 1. Incident Overview & Blast Radius Assessment

A Discord webhook URL was committed in plaintext to `Deployment/jenkins/Jenkinsfile` during initial pipeline development. GitGuardian flagged this secret as publicly exposed in historical commits.

### Blast Radius Analysis
- **Resource Exposed:** Discord Webhook URL for CI/CD failure notifications.
- **Risk Level:** Unauthorized actors with the URL could spam or send forged alert messages into the operational Discord channel.
- **Data Impact:** No access to backend databases, source code modifications, or cloud infrastructure credentials.

---

## 2. DevSecOps Remediation Workflow

In accordance with DevSecOps and GitGuardian incident response standards, remediation followed the 5-step lifecycle:

```
[1. Revoke Leaked Secret] 
       ↓
[2. Rotate Secret in Vault/Jenkins] 
       ↓
[3. Parameterize Code (withCredentials)] 
       ↓
[4. Shift-Left SAST Gates (TruffleHog/Gitleaks)] 
       ↓
[5. Resolve Incident in Monitoring Console]
```

### Step 1: Revocation of Leaked Secret
1. Navigate to the Discord server settings → **Integrations** → **Webhooks**.
2. Locate the compromised webhook associated with ID `1503984848643772597`.
3. Click **Delete Webhook** immediately to render the leaked token completely inert.
4. Attempting to POST to the old URL now returns `HTTP 404 Not Found` / `HTTP 401 Unauthorized`.

### Step 2: Generation and Secret Store Ingestion
1. Create a new webhook in the designated channel.
2. Store the newly generated URL inside Jenkins Credential Store:
   - **Type:** Secret text
   - **ID:** `discord-webhook-url`
   - **Scope:** Global (Jenkins CI)
3. For GitHub Actions (if used): Store as GitHub repository secret `DISCORD_WEBHOOK_URL`.

### Step 3: Pipeline Hardening
The Jenkinsfile is configured to inject the webhook URL securely at runtime using Jenkins `withCredentials`:

```groovy
withCredentials([string(credentialsId: 'discord-webhook-url', variable: 'DISCORD_WEBHOOK_URL')]) {
    sh '''
      if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl --fail --silent --show-error \
          -H "Content-Type: application/json" \
          -d "{\"content\":\"❌ Jenkins Pipeline Failed for loyalty-program build #${BUILD_NUMBER}\"}" \
          "$DISCORD_WEBHOOK_URL" || true
      else
        echo "DISCORD_WEBHOOK_URL credential not configured, skipping notification."
      fi
    '''
}
```

Key security controls applied:
- **Zero Plaintext:** No hardcoded tokens in any repository file.
- **Automatic Masking:** Jenkins automatically masks variables extracted via `withCredentials` in pipeline console logs (`****`).
- **Defensive Guard:** Validates variable existence prior to triggering `curl`.

### Step 4: Automated SAST Secret Scanning
- Configured `.trufflehog-ignore` and `.gitleaks.toml` for pre-commit and CI gates.
- Pipeline fails automatically if any future secret or token is detected.

---

## 3. GitGuardian Incident Resolution Steps

In the GitGuardian dashboard:
1. Navigate to **Incidents** → `#33623332`.
2. Click **Resolve** in the upper right corner.
3. Select Resolution Reason: **Revoked and rotated**.
4. Confirm that the secret has been deleted from Discord and replaced with a vault-managed credential.

---

## 4. Rollback & Verification

- **Verification:** Run `git grep -i "1503984"` to verify zero occurrences in active tracked files.
- **Test Notification:** Trigger a test pipeline build to confirm new credential delivery from Jenkins secret store.
