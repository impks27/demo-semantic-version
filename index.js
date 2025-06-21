const { execSync } = require('child_process');

function getSemanticVersion() {
  try {
    console.log('Fetching all tags from the repository...');
    // Get all tags in the repository
    const allTags = execSync('git tag', { encoding: 'utf-8' }).split('\n').filter(Boolean);
    console.log('All tags:', allTags);

    console.log('Filtering tags that follow semantic versioning pattern...');
    // Filter tags that follow semantic versioning pattern
    const semverTags = allTags.filter(tag => /^\d+\.\d+\.\d+$/.test(tag));
    console.log('Semantic version tags:', semverTags);

    if (semverTags.length === 0) {
      console.log('No valid semantic version tags found. Defaulting to version 1.0.0.');
      return '1.0.0';
    }

    console.log('Sorting semantic version tags in descending order...');
    // Sort tags in descending order (latest first)
    semverTags.sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
      const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

      if (aMajor !== bMajor) return bMajor - aMajor;
      if (aMinor !== bMinor) return bMinor - aMinor;
      return bPatch - aPatch;
    });
    console.log('Sorted semantic version tags:', semverTags);

    // Use the latest valid semantic version tag
    const latestTag = semverTags[0];
    console.log('Latest semantic version tag:', latestTag);
    let [major, minor, patch] = latestTag.split('.').map(Number);

    console.log(`Fetching commit messages since the latest tag (${latestTag})...`);
    // Get commit messages since the latest tag
    const commitMessages = execSync(`git log ${latestTag}..HEAD --pretty=format:%s`, { encoding: 'utf-8' }).split('\n');
    console.log('Commit messages:', commitMessages);

    console.log('Determining which part of the version to increment...');
    // Determine which part of the version to increment
    if (commitMessages.some(msg => msg.includes('BREAKING CHANGE'))) {
      console.log('Found "BREAKING CHANGE" in commit messages. Incrementing major version...');
      major += 1;
      minor = 0; // Reset minor
      patch = 0; // Reset patch
    } else if (commitMessages.some(msg => msg.startsWith('feat'))) {
      console.log('Found "feat" in commit messages. Incrementing minor version...');
      minor += 1;
      patch = 0; // Reset patch
    } else if (commitMessages.some(msg => msg.startsWith('fix'))) {
      console.log('Found "fix" in commit messages. Incrementing patch version...');
      patch += 1;
    } else {
      console.log('No specific rules matched. Incrementing patch version by default...');
      patch += 1;
    }

    // Construct the semantic version
    const newVersion = `${major}.${minor}.${patch}`;
    console.log('Generated new semantic version:', newVersion);
    return newVersion;
  } catch (error) {
    console.error('An error occurred while generating the semantic version:', error);
    return '1.0.0'; // Default version
  }
}

// Output the generated version in a structured format
const version = getSemanticVersion();
console.log(`::set-output name=version::${version}`);