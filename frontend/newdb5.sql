DROP DATABASE IF EXISTS project;
CREATE DATABASE project;
USE project;

-- Law Enforcement Departments
CREATE TABLE lawEnforcement (
    departmentID INT PRIMARY KEY AUTO_INCREMENT,
    departmentName VARCHAR(50) NOT NULL
);

-- Users
CREATE TABLE users (
    userID INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'police', 'cbi', 'forensic', 'court', 'cyber_security') NOT NULL,
    departmentID INT,
    badgeNumber VARCHAR(50),
    email VARCHAR(255),
    lastLogin DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    FOREIGN KEY (departmentID) REFERENCES lawEnforcement(departmentID)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Police Department
CREATE TABLE policeDepartment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    departmentId INT,
    location VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    email VARCHAR(255),
    FOREIGN KEY (departmentId) REFERENCES lawEnforcement(departmentID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Police Personnel
CREATE TABLE policePersonnel (
    personnelID INT PRIMARY KEY AUTO_INCREMENT,
    policeStationID INT,
    name VARCHAR(255) NOT NULL,
    personnelRank VARCHAR(100),
    badgeNumber VARCHAR(50) UNIQUE NOT NULL,
    contactNumber VARCHAR(20),
    email VARCHAR(255),
    dateOfJoining DATE,
    supervisorID INT,
    userID INT UNIQUE,
    FOREIGN KEY (policeStationID) REFERENCES policeDepartment(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (supervisorID) REFERENCES policePersonnel(personnelID)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- FIR
CREATE TABLE fir (
    firID INT PRIMARY KEY AUTO_INCREMENT,
    policeStationID INT,
    dateOfFiling DATE NOT NULL,
    caseType ENUM('Criminal', 'Civil', 'Other') NOT NULL,
    location VARCHAR(255) NOT NULL,
    evidence TEXT,
    createdBy INT,
    FOREIGN KEY (policeStationID) REFERENCES policeDepartment(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Entities tied to FIR
CREATE TABLE victim (
    victimID INT PRIMARY KEY AUTO_INCREMENT,
    firID INT,
    name VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    address TEXT,
    FOREIGN KEY (firID) REFERENCES fir(firID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE accused (
    accusedID INT PRIMARY KEY AUTO_INCREMENT,
    firID INT,
    name VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    address TEXT,
    FOREIGN KEY (firID) REFERENCES fir(firID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE suspect (
    suspectID INT PRIMARY KEY AUTO_INCREMENT,
    firID INT,
    name VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    address TEXT,
    FOREIGN KEY (firID) REFERENCES fir(firID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE witness (
    witnessID INT PRIMARY KEY AUTO_INCREMENT,
    firID INT,
    name VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    address TEXT,
    FOREIGN KEY (firID) REFERENCES fir(firID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Court
CREATE TABLE court (
    id INT PRIMARY KEY AUTO_INCREMENT,
    departmentID INT,
    location VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    email VARCHAR(255),
    FOREIGN KEY (departmentID) REFERENCES lawEnforcement(departmentID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Court Case
CREATE TABLE courtCase (
    caseID INT PRIMARY KEY AUTO_INCREMENT,
    firID INT UNIQUE,
    courtID INT,
    judgeName VARCHAR(255),
    verdict TEXT,
    assignedTo INT,
    FOREIGN KEY (firID) REFERENCES fir(firID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courtID) REFERENCES court(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (assignedTo) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Forensic & Post Mortem
CREATE TABLE forensicDepartment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    departmentID INT,
    location VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    email VARCHAR(255),
    FOREIGN KEY (departmentID) REFERENCES lawEnforcement(departmentID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE postMortemInstitute (
    id INT PRIMARY KEY AUTO_INCREMENT,
    departmentID INT,
    location VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    email VARCHAR(255),
    FOREIGN KEY (departmentID) REFERENCES lawEnforcement(departmentID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE postMortemReport (
    reportID INT PRIMARY KEY AUTO_INCREMENT,
    victimID INT UNIQUE,
    instituteID INT,
    causeOfDeath TEXT,
    dateOfExamination DATE,
    createdBy INT,
    FOREIGN KEY (victimID) REFERENCES victim(victimID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (instituteID) REFERENCES postMortemInstitute(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE forensicReport (
    reportID INT PRIMARY KEY AUTO_INCREMENT,
    firID INT UNIQUE,
    forensicLabID INT,
    details TEXT,
    reportDate DATE,
    createdBy INT,
    FOREIGN KEY (firID) REFERENCES fir(firID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (forensicLabID) REFERENCES forensicDepartment(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- CBI
CREATE TABLE cbi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    departmentID INT,
    location VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    email VARCHAR(255),
    FOREIGN KEY (departmentID) REFERENCES lawEnforcement(departmentID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE cbiPersonnel (
    personnelID INT PRIMARY KEY AUTO_INCREMENT,
    cbiOfficeID INT,
    name VARCHAR(255) NOT NULL,
    personnelRank VARCHAR(100),
    badgeNumber VARCHAR(50) UNIQUE NOT NULL,
    contactNumber VARCHAR(20),
    email VARCHAR(255),
    dateOfJoining DATE,
    userID INT UNIQUE,
    FOREIGN KEY (cbiOfficeID) REFERENCES cbi(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Cyber Crime
CREATE TABLE cyberSecurityAgency (
    id INT PRIMARY KEY AUTO_INCREMENT,
    departmentID INT,
    location VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    email VARCHAR(255),
    FOREIGN KEY (departmentID) REFERENCES lawEnforcement(departmentID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE cyberCrimeFIR (
    firID INT,
    agencyID INT,
    assignedTo INT,
    PRIMARY KEY (firID, agencyID),
    FOREIGN KEY (firID) REFERENCES fir(firID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (agencyID) REFERENCES cyberSecurityAgency(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (assignedTo) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- FIR Evidence
CREATE TABLE firEvidence (
    evidenceID INT PRIMARY KEY AUTO_INCREMENT,
    firID INT,
    evidenceType VARCHAR(255),
    description TEXT,
    submittedBy INT,
    FOREIGN KEY (firID) REFERENCES fir(firID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (submittedBy) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Case handled by multiple agencies
CREATE TABLE caseHandledBy (
    firID INT,
    departmentID INT,
    assignedUserID INT,
    PRIMARY KEY (firID, departmentID),
    FOREIGN KEY (firID) REFERENCES fir(firID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (departmentID) REFERENCES lawEnforcement(departmentID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (assignedUserID) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Detective Agency
CREATE TABLE detectiveAgency (
    id INT PRIMARY KEY AUTO_INCREMENT,
    departmentID INT,
    location VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20),
    email VARCHAR(255),
    FOREIGN KEY (departmentID) REFERENCES lawEnforcement(departmentID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- User Activity Logs
CREATE TABLE userActivityLog (
    logID INT PRIMARY KEY AUTO_INCREMENT,
    userID INT,
    activity VARCHAR(255) NOT NULL,
    tableName VARCHAR(50),
    recordID INT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES users(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 1. Law Enforcement Departments
INSERT INTO lawEnforcement (departmentName) VALUES
('Police'), ('CBI'), ('Forensic'), ('Court'), ('Cyber Security');

-- 2. Users
INSERT INTO users (username, password, name, role, departmentID, badgeNumber, email, status)
VALUES 
('admin', 'admin_pass', 'Admin', 'admin', NULL, NULL, 'admin@example.com', 'active'),
('officer1', 'test123', 'Officer One', 'police', 1, 'POL1001', 'police1@example.com', 'active'),
('cbi1', 'test123', 'CBI Agent', 'cbi', 2, 'CBI2001', 'cbi1@example.com', 'active'),
('judge1', 'test123', 'Judge Kumar', 'court', 4, 'CRT4001', 'judge@example.com', 'active');

-- 3. Police Department
INSERT INTO policeDepartment (departmentId, location, contactNumber, email)
VALUES (1, 'Downtown HQ', '1234567890', 'station@example.com');

-- 4. Police Personnel
INSERT INTO policePersonnel (policeStationID, name, personnelRank, badgeNumber, contactNumber, email, dateOfJoining, userID)
VALUES (1, 'Officer One', 'Inspector', 'POL1001', '1234567890', 'police1@example.com', '2020-01-01', 2);

-- 5. FIR
INSERT INTO fir (policeStationID, dateOfFiling, caseType, location, evidence, createdBy)
VALUES (1, '2024-01-15', 'Criminal', 'Main Street', 'Fingerprint found', 2);

-- 6. Victim
INSERT INTO victim (firID, name, contactNumber, address)
VALUES (1, 'Jane Victim', '9876543210', '123 Victim Street');

-- 7. Accused
INSERT INTO accused (firID, name, contactNumber, address)
VALUES (1, 'John Accused', '9876543211', '456 Accused Avenue');

-- 8. Suspect
INSERT INTO suspect (firID, name, contactNumber, address)
VALUES (1, 'Mike Suspect', '9876543212', '789 Suspect Blvd');

-- 9. Witness
INSERT INTO witness (firID, name, contactNumber, address)
VALUES (1, 'Wendy Witness', '9876543213', '321 Witness Rd');

-- 10. FIR Evidence
INSERT INTO firEvidence (firID, evidenceType, description, submittedBy)
VALUES (1, 'Fingerprint', 'Found on door', 2);

-- 11. Court
INSERT INTO court (departmentID, location, contactNumber, email)
VALUES (4, 'City Court', '9876543219', 'court@example.com');

-- 12. Court Case
INSERT INTO courtCase (firID, courtID, judgeName, verdict, assignedTo)
VALUES (1, 1, 'Judge Kumar', 'Pending', 4);

-- 13. Forensic Department
INSERT INTO forensicDepartment (departmentID, location, contactNumber, email)
VALUES (3, 'Central Lab', '9876543216', 'forensic@example.com');

-- 14. Forensic Report
INSERT INTO forensicReport (firID, forensicLabID, details, reportDate, createdBy)
VALUES (1, 1, 'DNA matched with suspect', '2024-01-20', 2);

-- 15. Post Mortem Institute
INSERT INTO postMortemInstitute (departmentID, location, contactNumber, email)
VALUES (3, 'City Morgue', '9876543217', 'morgue@example.com');

-- 16. Post Mortem Report
INSERT INTO postMortemReport (victimID, instituteID, causeOfDeath, dateOfExamination, createdBy)
VALUES (1, 1, 'Blunt trauma', '2024-01-18', 2);

-- 17. CBI
INSERT INTO cbi (departmentID, location, contactNumber, email)
VALUES (2, 'CBI HQ', '9876543218', 'cbi@example.com');

-- 18. CBI Personnel
INSERT INTO cbiPersonnel (cbiOfficeID, name, personnelRank, badgeNumber, contactNumber, email, dateOfJoining, userID)
VALUES (1, 'CBI Agent', 'Senior Officer', 'CBI2001', '9876543215', 'cbi1@example.com', '2021-03-10', 3);

-- 19. Cyber Security Agency
INSERT INTO cyberSecurityAgency (departmentID, location, contactNumber, email)
VALUES (5, 'Cyber Cell', '9876543222', 'cyber@example.com');

-- 20. Cyber Crime FIR
INSERT INTO cyberCrimeFIR (firID, agencyID, assignedTo)
VALUES (1, 1, 3);

-- 21. Case Handled By
INSERT INTO caseHandledBy (firID, departmentID, assignedUserID)
VALUES (1, 1, 2), (1, 2, 3);

-- 22. User Activity Log
INSERT INTO userActivityLog (userID, activity, tableName, recordID)
VALUES (2, 'Created FIR', 'fir', 1);

INSERT INTO lawEnforcement (departmentName) VALUES
('Police'), ('CBI'), ('Forensic'), ('Court'), ('Cyber Security');
