//iline from 1 - 18 are from CPEN320 course 
const path = require('path');
const fs = require('fs');
const express = require('express');
const mysql = require('mysql2');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}
const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');
// express app
let app = express();
app.use(express.json()) 						
app.use(express.urlencoded({ extended: true })) 
app.use(logRequest);							




// Create a connection this needs to be change according to your database setting (we use local host)
const db = mysql.createConnection({
    host: 'localhost',      // Hostname (or IP address) of the MySQL server
    user: 'root',           // Username (default is 'root')
    password: 'new_password', // Replace with your MySQL root password
    database: 'AB',    // Replace with your database name
  });
  
  //connect to database
  db.connect((err) => {
      if (err) throw err;
      console.log('Connected to database');``
      
      // Create tables for all entities
      const tableSchemas = {
          education: `
              CREATE TABLE IF NOT EXISTS education (
                  institution VARCHAR(100) NOT NULL,
                  program VARCHAR(100) NOT NULL,
                  Graduation_year VARCHAR(10) NOT NULL,
                  PRIMARY KEY (institution, program, Graduation_year)
              ) 
          `,
          occupation: `
              CREATE TABLE IF NOT EXISTS occupation (
                  company_name VARCHAR(100) NOT NULL,
                  job_title VARCHAR(100) NOT NULL,
                  location VARCHAR(150) NOT NULL,
                  salary DECIMAL(10,0),
                  PRIMARY KEY (company_name, job_title, location)
              )
          `,
          residence_info: `
              CREATE TABLE IF NOT EXISTS residence_info (
                  country VARCHAR(50) NOT NULL,
                  address VARCHAR(150) NOT NULL,
                  city VARCHAR(50) NOT NULL,
                  PRIMARY KEY (country, address, city)
              )
          `,
          personal_info: `
              CREATE TABLE IF NOT EXISTS personal_info (
                  sin VARCHAR(15) PRIMARY KEY NOT NULL UNIQUE,
                  fname VARCHAR(25) NOT NULL,
                  lname VARCHAR(25) NOT NULL,
                  gender VARCHAR(10) NOT NULL,
                  institution VARCHAR(100),
                  program VARCHAR(100),
                  Graduation_year VARCHAR(10),
                  company_name VARCHAR(100),
                  job_title VARCHAR(100),
                  location VARCHAR(150),
                  country VARCHAR(50),
                  address VARCHAR(150),
                  city VARCHAR(50),
                  FOREIGN KEY (institution, program, Graduation_year) REFERENCES education(institution, program, Graduation_year),
                  FOREIGN KEY (company_name, job_title, location) REFERENCES occupation(company_name, job_title, location),
                  FOREIGN KEY (country, address, city) REFERENCES residence_info(country, address, city)
              )
          `,
          marriage_record: `
              CREATE TABLE IF NOT EXISTS marriage_record (
                  sin1 VARCHAR(15) NOT NULL,
                  sin2 VARCHAR(15) NOT NULL,
                  PRIMARY KEY (sin1, sin2),
                  FOREIGN KEY (sin1) REFERENCES personal_info(sin)
              )
          `,
          birth_record: `
              CREATE TABLE IF NOT EXISTS birth_record (
                  sin VARCHAR(15) NOT NULL,
                  date_of_birth DATE NOT NULL,
                  place_of_birth VARCHAR(150),  
                  PRIMARY KEY (sin, date_of_birth),
                  FOREIGN KEY (sin) REFERENCES personal_info(sin) ON DELETE CASCADE
              )
          `,
          family_record: `
              CREATE TABLE IF NOT EXISTS family_record (
                  sin1 VARCHAR(15) NOT NULL,
                  sin2 VARCHAR(15) NOT NULL,
                  PRIMARY KEY (sin1, sin2),
                  FOREIGN KEY (sin1) REFERENCES personal_info(sin)
              )
          `
      };
      
      
      // creating tables
      for (const [tableName, query] of Object.entries(tableSchemas)) {
          db.query(query, (err, result) => {
              if (err) {
                //there is an error in creating the table
                  console.error("error creating table");
                  return;
              }
              console.log(`${tableName} table created`);
          });
      }
  });
  
  
//insert query
app.post('/add_person', (req, res) => {
    const {
        fname, lname, gender, sin,
        company_name, job_title, location, salary,
        institution, program, Graduation_year,
        country, address, city,
        marriage_id,
        date_of_birth,
        place_of_birth,
        family_id
    } = req.body;

    const data = {
        personal_info: {
            sin, fname, lname, gender
        },
        education: {
            institution, program, Graduation_year
        },
        occupation: {
            company_name, job_title, location, salary
        },
        residence_info: {
            country, address, city
        },
        marriage_record: {
            sin1: sin,
            sin2: marriage_id
        },
        birth_record: { 
            sin,
            date_of_birth,
            place_of_birth
        },
        family_record: {
            sin1: sin,
            sin2: family_id
        }
    };

    console.log(data);

    const educationQuery = `
        INSERT INTO education (institution, program, Graduation_year)
        VALUES (?, ?, ?)
    `
    db.query(educationQuery, [
        data.education.institution,
        data.education.program,
        data.education.Graduation_year
    ], (err) => {
        if (err) {
            // we allow duplicate entry error
            if (err.code === 'ER_DUP_ENTRY') {
                console.error('Education record already exists:', err);
            }else{
                //other error we handle this as server error
                console.error('Error inserting education:', err);
                return res.status(500).json({error: 'Database error while inserting education'});
            }
        }


        const occupationQuery = `
            INSERT INTO occupation (company_name, job_title, location, salary)
            VALUES (?, ?, ?, ?)
        `;
        db.query(occupationQuery, [
            data.occupation.company_name,
            data.occupation.job_title,
            data.occupation.location,
            data.occupation.salary
        ], (err) => {
            if (err) {
                // we allow duplicate entry error
                if (err.code === 'ER_DUP_ENTRY') {
                    console.error('Occupation record already exists:', err);
                }else{
                    //other error we handle this as server error
                    console.error('Error inserting occupation:', err);
                    return res.status(500).json({error: 'Database error while inserting occupation'});
                }
            }

         
            const residenceQuery = `
                INSERT INTO residence_info (country, address, city)
                VALUES (?, ?, ?)
            `;
            db.query(residenceQuery, [
                data.residence_info.country,
                data.residence_info.address,
                data.residence_info.city
            ], (err) => {
                if (err) {
                    // we allow duplicate entry error
                    if (err.code === 'ER_DUP_ENTRY') {
                        console.error('Residence info record already exists:', err);
                    }else{
                        console.error('Error inserting residence info:', err);
                        return res.status(500).json({error: 'Database error while inserting residence info'});
                    }
                }

                const personalInfoQuery = `
                    INSERT INTO personal_info (sin, fname, lname, gender, institution, program, Graduation_year, company_name, job_title, location, country, address, city)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(personalInfoQuery, [
                    data.personal_info.sin,
                    data.personal_info.fname,
                    data.personal_info.lname,
                    data.personal_info.gender,
                    data.education.institution,
                    data.education.program,
                    data.education.Graduation_year,
                    data.occupation.company_name,
                    data.occupation.job_title,
                    data.occupation.location,
                    data.residence_info.country,
                    data.residence_info.address,
                    data.residence_info.city
                ], (err, personalResult) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            console.error('Personal info record already exists:', err);
                        }else{
                            console.error('Error inserting personal info:', err);
                            return res.status(500).json({error: 'Database error while inserting personal info'});
                        }
                    }

                    const marriageQuery = `
                        INSERT INTO marriage_record (sin1, sin2)
                        VALUES (?, ?)
                `;
                    db.query(marriageQuery, [
                        data.marriage_record.sin1,
                        data.marriage_record.sin2
                    ], (err) => {   
                        if (err) {
                            // we allow duplicate entry error
                            if (err.code === 'ER_DUP_ENTRY') {
                                console.error('Marriage record already exists:', err);
                            }else{
                                console.error('Error inserting marriage record:', err);
                                return res.status(500).json({error: 'Database error while inserting marriage record'});
                            }
                        }
                    });

                    const birthQuery = `
                        INSERT INTO birth_record (sin, date_of_birth, place_of_birth)
                        VALUES (?, ?, ?)
                    `;
                    db.query(birthQuery, [
                        data.birth_record.sin,      
                        data.birth_record.date_of_birth,
                        data.birth_record.place_of_birth
                    ], (err) => {
                        if (err) {
                            // we allow duplicate entry error
                            if (err.code === 'ER_DUP_ENTRY') {
                                console.error('Birth record already exists:', err);
                            }else{
                                console.error('Error inserting birth record:', err);
                                return res.status(500).json({error: 'Database error while inserting birth record'});
                            }
                        }
                    });
                    const familyQuery = `
                        INSERT INTO family_record (sin1, sin2)
                        VALUES (?, ?)
                    `;
                    db.query(familyQuery, [
                        data.family_record.sin1,
                        data.family_record.sin2
                    ], (err) => {   
                        if (err) {
                            // we allow duplicate entry error
                            if (err.code === 'ER_DUP_ENTRY') {
                                console.error('Family record already exists:', err);
                            }else{
                                console.error('Error inserting family record:', err);
                                return res.status(500).json({error: 'Database error while inserting family record'});
                            }
                        }
                    });
                    res.json({ message: 'Data inserted successfully into all tables!' });//success message sent back to user
                });
            });
        });
    });
});

//search query
app.get('/search_family', (req, res) => {
    const sin = req.query.sin;
    if (!sin) {
        return res.status(400).send({ error: "SIN is required" });
    }

    const query = `
        SELECT p.sin, p.fname, p.lname, p.gender, p.city, p.address,
               f.sin2 AS family_member_sin,
               pf.fname AS family_fname, pf.lname AS family_lname
        FROM personal_info p
        LEFT JOIN family_record f ON p.sin = f.sin1
        LEFT JOIN personal_info pf ON f.sin2 = pf.sin
        WHERE p.sin = ?
    `;

    db.query(query, [sin], (err, results) => {
        if (err) {
            console.error("Error fetching family data:", err);
            return res.status(500).send({ error: "Database query failed" });
        }
        res.send(results);
    });
});

app.post('/search_family', (req, res) => {
    const {SIN} = req.body;
    if (!SIN) {
        return res.status(400).json({error: "SIN is required"});
    }

    const personal_query = `DELETE FROM personal_info WHERE sin = ?`;
    const marriage_query = `DELETE FROM marriage_record where sin1 = ?`;
    const birth_query = `DELETE FROM birth_record WHERE sin = ?`;
    const family_query = `DELETE FROM family_record WHERE sin1 = ?`;

    db.query(marriage_query, [SIN], (err, result) => {
        if (err) {
            console.error('Error deleting:', err);
            return;
        }
        db.query(family_query, [SIN], (err, result) => {
            if (err) {
                console.error('Error deleting:', err);
                return;
            }
            db.query(birth_query, [SIN], (err, result) => {
                if (err) {
                    console.error('Error deleting:', err);
                    return;
                }

                db.query(personal_query, [SIN], (err, result) => {
                    if (err) {
                        console.error('Error deleting:', err);
                        return;
                    }

                    if (!result) {
                        console.log('No records found to delete.');
                        return res.status(404).json({message: 'No records'});
                    }
                    
                    res.json({
                        message: 'Records deleted'
                    });
                });
            });

        });
    });
});    


app.get('/get_personal_info', (req, res) => {
    const sin = req.query.sin;
    if (!sin) {
        return res.status(400).json({ error: "SIN is required" });
    }

    const query = `
        SELECT 
            p.sin, p.fname, p.lname, p.gender, p.city, p.address,
            e.institution, e.program, e.Graduation_year,
            o.company_name, o.job_title, o.location, o.salary,
            r.country, r.address AS residence_address, r.city AS residence_city,
            m.sin2 AS spouse_sin,
            b.place_of_birth, b.date_of_birth
        FROM personal_info p
        LEFT JOIN education e ON p.institution = e.institution AND p.program = e.program AND p.Graduation_year = e.Graduation_year
        LEFT JOIN occupation o ON p.company_name = o.company_name AND p.job_title = o.job_title AND p.location = o.location
        LEFT JOIN residence_info r ON p.country = r.country AND p.address = r.address AND p.city = r.city
        LEFT JOIN marriage_record m ON p.sin = m.sin1
        LEFT JOIN birth_record b ON p.sin = b.sin
        WHERE p.sin = ?
    `;

    db.query(query, [sin], (err, results) => {
        if (err) {
            console.error('Error fetching personal information:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'No data found for the given SIN' });
        }
        res.json(results[0]); // Return the first record
    });
});


app.post('/update_personal_info', (req, res) => {
    const {
        sin, fname, lname, gender, city, address,
        institution, program, Graduation_year,
        company_name, job_title, location, salary,
        country, residence_address, residence_city,
        spouse_sin, place_of_birth, date_of_birth
    } = req.body;

    const queries = [];

    // Update personal_info
    queries.push({
        query: `
            UPDATE personal_info
            SET fname = ?, lname = ?, gender = ?, city = ?, address = ?
            WHERE sin = ?
        `,
        params: [fname, lname, gender, city, address, sin]
    });

    // Update education
    if (institution || program || Graduation_year) {
        queries.push({
            query: `
                INSERT INTO education (institution, program, Graduation_year)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                institution = VALUES(institution),
                program = VALUES(program),
                Graduation_year = VALUES(Graduation_year)
            `,
            params: [institution, program, Graduation_year]
        });
    }

    // Update occupation
    if (company_name || job_title || location || salary) {
        queries.push({
            query: `
                INSERT INTO occupation (company_name, job_title, location, salary)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                company_name = VALUES(company_name),
                job_title = VALUES(job_title),
                location = VALUES(location),
                salary = VALUES(salary)
            `,
            params: [company_name, job_title, location, salary]
        });
    }

    // Update residence_info
    if (country || residence_address || residence_city) {
        queries.push({
            query: `
                INSERT INTO residence_info (country, address, city)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                country = VALUES(country),
                address = VALUES(address),
                city = VALUES(city)
            `,
            params: [country, residence_address, residence_city]
        });
    }

    // Update marriage_record
    if (spouse_sin) {
        queries.push({
            query: `
                INSERT INTO marriage_record (sin1, sin2)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE sin2 = VALUES(sin2)
            `,
            params: [sin, spouse_sin]
        });
    }

    // Update birth_record
    if (place_of_birth) {
        queries.push({
            query: `
                INSERT INTO birth_record (sin, place_of_birth, date_of_birth)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                place_of_birth = VALUES(place_of_birth),
                date_of_birth = VALUES(date_of_birth)
            `,
            params: [sin, place_of_birth, date_of_birth]
        });
    }

    // Execute all queries
    let completed = 0;
    queries.forEach(({ query, params }) => {
        db.query(query, params, (err) => {
            if (err) {
                console.error('Error updating database:', err);
                return res.status(500).json({ error: 'Database update failed' });
            }
            completed++;
            if (completed === queries.length) {
                res.json({ message: 'Update successful!' });
            }
        });
    });
});

app.get('/get_all_personal_info', (req, res) => {
    const query = `
        SELECT 
            fname, lname, gender, institution, program, 
            Graduation_year, company_name, job_title, location, 
            country, city 
        FROM personal_info
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching all personal information:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
});

//Group by query (categorize data into country groups and count the number of residents)
app.get('/get_num_people_country', (req, res) => {
    const query = `
        SELECT 
            country,
            COUNT(*) as number_of_residents
        FROM personal_info
        GROUP BY country
        ORDER BY number_of_residents DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching population statistics:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        console.log(results);
        res.json(results);
    });
    
});

app.get('/get_salary_people', (req, res) => {
    const query = `
    SELECT DISTINCT p.fname, p.lname, p.gender, p.institution, p.program, p.Graduation_year, p.country, p.city, o.company_name, o.job_title, o.location, o.salary
    FROM personal_info p JOIN occupation o
    WHERE p.company_name = o.company_name AND p.location = o.location AND o.salary > 100;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching salary statistics:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
})

app.get('/get_male_by_country', (req, res) => {
    const query = `
        SELECT 
            country, 
            CAST(SUM(male_count) AS UNSIGNED) AS number_of_residents
        FROM (
            SELECT 
                p.country, 
                p.gender,
                COUNT(*) AS male_count
            FROM personal_info p
            WHERE p.gender = 'Male'
            GROUP BY p.country, p.gender
        ) AS subquery
        GROUP BY country
        ORDER BY number_of_residents DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching high salary by country:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        console.log(results);
        res.json(results);
    });
});

//code below is also from CPEN320 course
app.use('/', express.static(clientApp, { 
    extensions: ['html'], 
    index: 'index.html'
}));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});