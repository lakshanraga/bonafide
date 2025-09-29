export const bonafideCertificateHtmlTemplate = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; margin-bottom: 5px;">BONAFIDE CERTIFICATE</h1>
        <hr style="border: 0; height: 2px; background-color: #3498db; width: 80px; margin: 10px auto;">
    </div>

    <p style="margin-bottom: 15px;">This is to certify that Mr./Ms. <strong>{studentName}</strong>,</p>
    <p style="margin-bottom: 15px;">Son/Daughter of Mr./Mrs. <strong>{parentName}</strong>,</p>
    <p style="margin-bottom: 15px;">is/was a bonafide student of <strong>Adhiyamaan College of Engineering</strong>, located at <strong>Dr.M.G.R.Nagar, Hosur, Krishnagiri District, Tamil Nadu, India. Pin:635 130</strong>.</p>

    <p style="margin-bottom: 15px;">He/She has been studying in this institution from <strong>{admissionDate}</strong> to <strong>{presentDate}</strong>.</p>
    <p style="margin-bottom: 15px;">During this period, he/she has been enrolled in <strong>{department}</strong> in the Department of <strong>{department}</strong>.</p>
    <p style="margin-bottom: 15px;">His/Her enrollment/roll number is <strong>{studentId}</strong>.</p>
    <p style="margin-bottom: 15px;">His/Her date of birth as per our records is <strong>{studentDOB}</strong>.</p>
    <p style="margin-bottom: 15px;">His/Her nationality is <strong>{studentNationality}</strong>.</p>
    <p style="margin-bottom: 15px;">He/She has studied in this college up to <strong>Semester {currentSemester}</strong>.</p>

    <p style="margin-top: 30px; margin-bottom: 15px;">This certificate is issued upon his/her request for the purpose of <strong>{reason}</strong>.</p>

    <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-GB")}</p>
            <p><strong>Place:</strong> Hosur</p>
        </div>
        <div style="text-align: right;">
            <p style="margin-bottom: 50px;">&nbsp;</p>
            <p><strong>Seal & Signature of Head of Institution / Principal</strong></p>
        </div>
    </div>
</div>
`;