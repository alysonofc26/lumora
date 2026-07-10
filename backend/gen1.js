const fs=require("fs");const p=__dirname+"/src/seed.js";let c=fs.readFileSync(p,"utf8");c+="\nconst items=[";fs.writeFileSync(p,c);console.log("p1 ok");
