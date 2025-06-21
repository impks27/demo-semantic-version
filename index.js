const { execSync } = require('child_process');

function getSemanticVersion() {
  try {
    console.log('Fetching all tags from the repository...');
    // Get all tags in the repository
    const allTags = execSync('git tag', { encoding: 'utf-8' }).split('\n').filter(Boolean);
    console.log('All tags:', allTags);

    console.log('Filtering tags that follow semantic versioning pattern and do not start with a year...');
    // Filter tags that follow semantic versioning pattern and exclude tags starting with a year
    const semverTags = allTags.filter(tag => /^\d+\.\d+\.\d+$/.test(tag) && !/^20\d{2}\./.test(tag));
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

    console.log('Determining which part of the version to increment based on Conventional Commits...');
    // Determine which part of the version to increment based on Conventional Commits
    if (commitMessages.some(msg => msg.toUpperCase().includes('BREAKING CHANGE') || msg.toUpperCase().includes('MAJOR'))) {
      console.log('Found "BREAKING CHANGE" or "MAJOR" in commit messages. Incrementing major version...');
      major += 1;
      minor = 0; // Reset minor
      patch = 0; // Reset patch
    } else if (commitMessages.some(msg => msg.toUpperCase().includes('FEAT') || msg.toUpperCase().includes('MINOR'))) {
      console.log('Found "FEAT" or "MINOR" in commit messages. Incrementing minor version...');
      minor += 1;
      patch = 0; // Reset patch
    } else if (commitMessages.some(msg => msg.toUpperCase().includes('FIX') || msg.toUpperCase().includes('PATCH'))) {
      console.log('Found "FIX" or "PATCH" in commit messages. Incrementing patch version...');
      patch += 1;
    } else {
      console.log('No Conventional Commit rules matched. Incrementing patch version by default...');
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
console.log(`::set-output name=version::${version.toUpperCase()}`);