from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]


def _read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text(encoding="utf-8")


def test_release_tag_workflow_publishes_public_history_without_hosted_deploy():
    workflow = _read(".github/workflows/release-tag.yml")

    assert "uses: ./.github/workflows/mirror-public.yml" in workflow
    assert "uses: ./.github/workflows/deploy-hosted.yml" not in workflow
    assert re.search(r"publish-public:\n(?:.*\n)*?\s+contents:\s+read", workflow)
    assert "source_event_name: push" in workflow
    assert "source_ref_type: tag" in workflow
    assert "source_ref_name: ${{ github.ref_name }}" in workflow
    assert "source_sha: ${{ github.sha }}" in workflow


def test_mirror_public_workflow_is_reusable_and_still_manual_dispatchable():
    workflow = _read(".github/workflows/mirror-public.yml")

    assert "workflow_call:" in workflow
    assert "workflow_dispatch:" in workflow
    assert "source_sha:" in workflow
    assert "source_ref_name:" in workflow
    assert "Manual public release must be dispatched from master" in workflow
    assert "must point to a commit already merged into master" in workflow


def test_internal_release_pipeline_files_stay_out_of_public_snapshot():
    excluded = _read(".github/public-mirror-exclude.txt")

    assert ".github/workflows/deploy-hosted.yml" in excluded
    assert ".github/workflows/release-tag.yml" in excluded
    assert ".github/workflows/mirror-public.yml" in excluded
    assert "scripts/deploy_hosted.sh" in excluded


def test_hosted_deploy_script_keeps_healthcheck_and_metadata_contract():
    script = _read("scripts/deploy_hosted.sh")

    assert "http://localhost:8000/api/health" in script
    assert "NOVWR_HEALTHCHECK_RETRIES" in script
    assert "last-success.env" in script
    assert "current-sha.txt" in script
    assert "systemctl restart novwr" in script
    assert '"$py_bin" -m pip install -r requirements.txt' in script


def test_dockerfile_allows_frontend_build_mode_overrides():
    dockerfile = _read("Dockerfile")

    assert "ARG VITE_DEPLOY_MODE=selfhost" in dockerfile
    assert 'VITE_DEPLOY_MODE="$VITE_DEPLOY_MODE"' in dockerfile
    assert "COPY data/demo/ data/demo/" in dockerfile
    assert "COPY data/worldpacks/ data/worldpacks/" in dockerfile


def test_docker_build_context_keeps_demo_seed_assets():
    dockerignore = _read(".dockerignore")

    assert "!data/demo/" in dockerignore
    assert "!data/demo/**" in dockerignore
    assert "!data/worldpacks/" in dockerignore
    assert "!data/worldpacks/**" in dockerignore


def test_hosted_compose_builds_frontend_in_hosted_mode():
    compose = _read("deploy/hosted/docker-compose.yml")

    assert "VITE_DEPLOY_MODE: hosted" in compose


def test_hosted_deploy_workflow_bootstraps_script_from_origin_master_for_rollbacks():
    workflow = _read(".github/workflows/deploy-hosted.yml")

    assert "git show origin/master:scripts/deploy_hosted.sh" in workflow
    assert "bash .deploy/deploy_hosted.sh" in workflow
    assert (
        "git fetch origin refs/heads/master:refs/remotes/origin/master --tags --force"
        in workflow
    )
    assert "git checkout --detach %q && NOVWR_PREVIOUS_SHA" not in workflow
