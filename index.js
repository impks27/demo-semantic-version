const { execSync } = require('child_process');

function getSemanticVersion() {
  try {
    // Get all tags in the repository
    const allTags = execSync('git tag', { encoding: 'utf-8' }).split('\n').filter(Boolean);

    // Filter tags that follow semantic versioning pattern
    const semverTags = allTags.filter(tag => /^\d+\.\d+\.\d+$/.test(tag));

    if (semverTags.length === 0) {
      // No valid semantic version tags, start with default version
      return '1.0.0';
    }

    // Sort tags in descending order (latest first)
    semverTags.sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
      const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

      if (aMajor !== bMajor) return bMajor - aMajor;
      if (aMinor !== bMinor) return bMinor - aMinor;
      return bPatch - aPatch;
    });

    // Use the latest valid semantic version tag
    const latestTag = semverTags[0];
    let [major, minor, patch] = latestTag.split('.').map(Number);

    // Get commit messages since the latest tag
    const commitMessages = execSync(`git log ${latestTag}..HEAD --pretty=format:%s`, { encoding: 'utf-8' }).split('\n');

    // Determine which part of the version to increment
    if (commitMessages.some(msg => msg.includes('BREAKING CHANGE'))) {
      major += 1;
      minor = 0; // Reset minor
      patch = 0; // Reset patch
    } else if (commitMessages.some(msg => msg.startsWith('feat'))) {
      minor += 1;
      patch = 0; // Reset patch
    } else if (commitMessages.some(msg => msg.startsWith('fix'))) {
      patch += 1;
    } else {
      // Fallback: Always increment PATCH if no rules are satisfied
      patch += 1;
    }

    // Construct the semantic version
    return `${major}.${minor}.${patch}`;
  } catch (error) {
    // Handle unexpected errors
    return '1.0.0'; // Default version
  }
}

console.log(getSemanticVersion());