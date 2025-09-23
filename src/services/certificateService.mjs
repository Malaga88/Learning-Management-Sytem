import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';

class CertificateService {
    constructor() {
        this.certificatesDir = './certificates';
        this.ensureCertificatesDirectory();
    }

    async ensureCertificatesDirectory() {
        try {
            await fs.access(this.certificatesDir);
        } catch {
            await fs.mkdir(this.certificatesDir, { recursive: true });
        }
    }

    async generateCertificate(user, course, completionDate = new Date()) {
        try {
            const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
            const filename = `certificate-${user._id}-${course._id}-${Date.now()}.pdf`;
            const filePath = path.join(this.certificatesDir, filename);
            
            // Create write stream
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Certificate background
            doc.rect(0, 0, doc.page.width, doc.page.height)
               .fill('#f8f9fa');

            // Border
            doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
               .lineWidth(3)
               .stroke('#2c3e50');

            doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
               .lineWidth(1)
               .stroke('#34495e');

            // Title
            doc.fillColor('#2c3e50')
               .fontSize(48)
               .font('Helvetica-Bold')
               .text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center' });

            // Subtitle
            doc.fontSize(18)
               .font('Helvetica')
               .text('This is to certify that', 0, 180, { align: 'center' });

            // Student name
            doc.fontSize(36)
               .font('Helvetica-Bold')
               .fillColor('#3498db')
               .text(user.name, 0, 220, { align: 'center' });

            // Course completion text
            doc.fontSize(18)
               .font('Helvetica')
               .fillColor('#2c3e50')
               .text('has successfully completed the course', 0, 280, { align: 'center' });

            // Course name
            doc.fontSize(28)
               .font('Helvetica-Bold')
               .fillColor('#e74c3c')
               .text(course.title, 0, 320, { align: 'center' });

            // Date
            doc.fontSize(16)
               .font('Helvetica')
               .fillColor('#2c3e50')
               .text(`Completed on ${completionDate.toLocaleDateString('en-US', { 
                   year: 'numeric', 
                   month: 'long', 
                   day: 'numeric' 
               })}`, 0, 380, { align: 'center' });

            // Course level badge
            if (course.level) {
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .fillColor('#27ae60')
                   .text(`Level: ${course.level.toUpperCase()}`, 0, 420, { align: 'center' });
            }

            // Instructor signature section
            const signatureY = 480;
            doc.fontSize(14)
               .font('Helvetica')
               .fillColor('#2c3e50')
               .text('Instructor:', 100, signatureY);

            doc.moveTo(180, signatureY + 15)
               .lineTo(350, signatureY + 15)
               .stroke();

            // Platform signature section  
            doc.text('Platform:', 450, signatureY);
            doc.moveTo(520, signatureY + 15)
               .lineTo(690, signatureY + 15)
               .stroke();

            // Certificate ID
            const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            doc.fontSize(10)
               .text(`Certificate ID: ${certificateId}`, 0, doc.page.height - 80, { align: 'center' });

            // Footer
            doc.fontSize(12)
               .text(`${process.env.APP_NAME || 'LMS Platform'}`, 0, doc.page.height - 60, { align: 'center' });

            // Finalize PDF
            doc.end();

            // Wait for stream to finish
            await new Promise((resolve) => stream.on('finish', resolve));

            const certificateUrl = `${process.env.API_URL}/certificates/${filename}`;
            
            return {
                success: true,
                certificateId,
                filePath,
                filename,
                url: certificateUrl
            };
        } catch (error) {
            console.error('Certificate generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new CertificateService();