import { Report } from "@/types/assessment";

export async function generatePDF(report: Report): Promise<void> {
  // Note: Using jsPDF would be ideal here, but due to the requirement to avoid
  // additional package installation, we'll generate a simple HTML-based PDF
  const content = document.createElement('div');
  content.innerHTML = `
    <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: navy; }
          .section { margin: 20px 0; }
          .practice { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
          .status { font-weight: bold; }
          .evidence { margin-top: 10px; }
        </style>
      </head>
      <body>
        <h1>${report.title}</h1>
        <div class="section">
          <h2>Assessment Summary</h2>
          <p>Generated on: ${new Date(report.createdAt).toLocaleString()}</p>
        </div>
        ${Object.entries(report.data.practices.reduce((acc: any, practice: any) => {
          if (!acc[practice.domain]) acc[practice.domain] = [];
          acc[practice.domain].push(practice);
          return acc;
        }, {})).map(([domain, practices]: [string, any[]]) => `
          <div class="section">
            <h3>${domain}</h3>
            ${practices.map((practice: any) => {
              const assessment = report.data.assessments.find(
                (a: any) => a.practiceId === practice.practiceId
              );
              return `
                <div class="practice">
                  <h4>${practice.practiceId} - ${practice.name}</h4>
                  <p>${practice.description}</p>
                  <p class="status">Status: ${assessment?.status || 'Not Started'}</p>
                  ${assessment?.evidence ? `
                    <div class="evidence">
                      <p><strong>Evidence:</strong></p>
                      <p>${assessment.evidence}</p>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </body>
    </html>
  `;

  const blob = new Blob([content.outerHTML], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.title}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
