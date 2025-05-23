const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running postinstall script...');

// Create necessary directories if they don't exist
const directories = ['uploads', 'models'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✓ Created ${dir} directory`);
    } catch (error) {
      console.warn(`⚠ Warning: Could not create ${dir} directory: ${error.message}`);
    }
  } else {
    console.log(`✓ ${dir} directory already exists`);
  }
});

// Install Windows build tools if on Windows
if (process.platform === 'win32') {
  console.log('Windows detected, checking for build tools...');
  try {
    execSync('npm install --global --production windows-build-tools', { stdio: 'inherit' });
    console.log('✓ Windows build tools installed successfully');
  } catch (error) {
    console.warn('⚠ Warning: Could not install Windows build tools. This might affect canvas installation.');
    console.warn('You may need to install Visual Studio Build Tools manually.');
  }
}

// Install canvas dependencies
console.log('Installing canvas dependencies...');
try {
  execSync('npm install canvas --build-from-source', { stdio: 'inherit' });
  console.log('✓ Canvas installation completed successfully!');
} catch (error) {
  console.error('❌ Error installing canvas:', error.message);
  console.log('\nTroubleshooting tips:');
  console.log('1. Make sure you have Python 2.7 installed');
  console.log('2. On Windows, ensure Visual Studio Build Tools are installed');
  console.log('3. Try running: npm install --global --production windows-build-tools');
  console.log('4. If issues persist, try: npm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas');
  process.exit(1);
} 