const fs = require('fs');
const files = [
  'src/pages/Menu.jsx',
  'src/pages/Products.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Pockets.jsx',
  'src/pages/Settings.jsx',
  'src/pages/Terms.jsx',
  'src/pages/PersonalFinance.jsx',
  'src/pages/DianAssistant.jsx',
  'src/pages/Facturero.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Fix the syntax errors
    content = content.replace(/className= shadow-glow-sm"([^"]*)"/g, 'className="$1 shadow-glow-sm"');
    content = content.replace(/className= shadow-glow-sm"/g, 'className="');
    
    // Some places might have double shadow-glow-sm
    content = content.replace(/ shadow-glow-sm shadow-glow-sm/g, ' shadow-glow-sm');
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed syntax in ' + file);
    }
  }
});
