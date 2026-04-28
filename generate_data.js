const fs = require('fs');

const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Aisha", "Wei", "Priya", "Diego", "Fatima"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Chen", "Gupta", "Patel", "Nguyen", "Kim"];
const genders = ["Male", "Female", "Non-binary", "Male", "Female", "Male", "Female"];
const universities = ["State University", "Tech Institute", "Ivy League", "Community College", "Online Bootcamp", "City College"];
const roles = ["Software Engineer", "Frontend Developer", "Backend Developer", "Data Scientist"];

let csvContent = "Name,Gender,Age,University,YearsOfExperience,CGPA,RoleApplied,Outcome\n";

for (let i = 0; i < 100; i++) {
    const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    
    // Create some latent bias in the data: Ivy League gets selected more often, older age gets rejected more often.
    let age = Math.floor(Math.random() * 35) + 22; // 22 to 56
    let uni = universities[Math.floor(Math.random() * universities.length)];
    let yoe = Math.max(0, age - 22);
    let cgpa = (Math.random() * 4 + 6).toFixed(1); // 6.0 to 10.0
    let role = roles[Math.floor(Math.random() * roles.length)];
    
    let score = 0;
    if (uni === "Ivy League") score += 30;
    if (age > 40) score -= 20; // Age bias
    if (gender === "Female" && role === "Backend Developer") score -= 15; // Gender bias
    score += parseFloat(cgpa) * 5;
    score += yoe * 2;
    
    let outcome = score > 65 ? "Selected" : "Rejected";
    
    csvContent += `${fname} ${lname},${gender},${age},${uni},${yoe},${cgpa},${role},${outcome}\n`;
}

fs.writeFileSync('demo_dataset.csv', csvContent);
console.log("demo_dataset.csv generated successfully with 100 records.");
