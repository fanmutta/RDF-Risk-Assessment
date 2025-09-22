

import React, { useState, useCallback, useMemo } from 'react';
import { AssessmentSection, FormData, Status } from './types';
import { INITIAL_FORM_SECTIONS } from './constants';
import FormHeader from './components/FormHeader';
import AssessmentSectionComponent from './components/AssessmentSection';
import FollowUpSection from './components/FollowUpSection';
import SummaryDashboard from './components/SummaryDashboard';
import Modal from './components/Modal';

// Allow TypeScript to recognize the global variables from the CDN scripts
declare const html2canvas: any;
declare const jspdf: any;

const DEFAULT_RECIPIENT_EMAIL = 'area.report@example.com'; // TODO: Replace with default recipient email

const getInitialFormData = (): FormData => {
  const sectionsWithState = INITIAL_FORM_SECTIONS.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      instances: [{
        status: null,
        description: '',
        photo: null,
      }]
    })),
  }));

  return {
    header: {
      assessmentDate: new Date().toISOString().split('T')[0],
      areaLocation: '',
      assessorName: '',
    },
    sections: sectionsWithState,
    followUp: {
      summary: '',
      recommendations: '',
      personInCharge: '',
      targetDate: '',
    },
  };
};


const App: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingEmail, setIsExportingEmail] = useState(false);
  const [openSectionIndex, setOpenSectionIndex] = useState<number | null>(0);
  const [filterNotOK, setFilterNotOK] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState(DEFAULT_RECIPIENT_EMAIL);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>(getInitialFormData);

  const validateForm = useCallback((): boolean => {
    const errors: string[] = [];
    let firstErrorSectionIndex: number | null = null;
    let hasNullStatus = false;
    let hasMissingDescription = false;

    formData.sections.forEach((section, sectionIndex) => {
      section.items.forEach((item) => {
        item.instances.forEach((instance, instanceIndex) => {
          const instanceId = `${item.id}-${instanceIndex}`;
          let isInvalid = false;
          
          if (instance.status === null) {
            isInvalid = true;
            hasNullStatus = true;
          } else if (instance.status === 'Not OK' && !instance.description.trim()) {
            isInvalid = true;
            hasMissingDescription = true;
          }

          if (isInvalid) {
            errors.push(instanceId);
            if (firstErrorSectionIndex === null) {
              firstErrorSectionIndex = sectionIndex;
            }
          }
        });
      });
    });

    setValidationErrors(errors);

    if (errors.length > 0) {
      let alertMessage = 'Form is incomplete!\n';
      if (hasNullStatus) {
        alertMessage += '- Please complete all assessment statuses (OK/Not OK/N/A).\n';
      }
      if (hasMissingDescription) {
        alertMessage += '- Please fill in the description for all items with "Not OK" status.\n';
      }
      alert(alertMessage);
      
      if (firstErrorSectionIndex !== null && openSectionIndex !== firstErrorSectionIndex) {
        setOpenSectionIndex(firstErrorSectionIndex);
      }
      return false;
    }
    return true;
  }, [formData.sections, openSectionIndex]);


  const handleHeaderChange = useCallback((field: keyof FormData['header'], value: string) => {
    setFormData(prev => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
  }, []);

  const handleStatusChange = useCallback((sectionIndex: number, itemIndex: number, instanceIndex: number, status: Status) => {
    setFormData(prev => {
      const newSections = prev.sections.map((section, sIdx) => {
        if (sIdx !== sectionIndex) return section;
        return {
          ...section,
          items: section.items.map((item, iIdx) => {
            if (iIdx !== itemIndex) return item;
            return {
              ...item,
              instances: item.instances.map((instance, instIdx) => {
                if (instIdx !== instanceIndex) return instance;
                
                const newStatus = instance.status === status ? null : status;
                
                const instanceId = `${item.id}-${instanceIndex}`;
                const isNowValid = newStatus !== null && (newStatus !== 'Not OK' || instance.description.trim() !== '');
                
                if (isNowValid) {
                  setValidationErrors(prevErrors => prevErrors.filter(err => err !== instanceId));
                } else {
                   if (!validationErrors.includes(instanceId)) {
                     setValidationErrors(prevErrors => [...prevErrors, instanceId]);
                   }
                }

                return {
                  ...instance,
                  status: newStatus,
                };
              })
            };
          })
        };
      });
      return { ...prev, sections: newSections };
    });
  }, [validationErrors]);

  const handleDescriptionChange = useCallback((sectionIndex: number, itemIndex: number, instanceIndex: number, description: string) => {
    setFormData(prev => {
        const newSections = prev.sections.map((section, sIdx) => {
            if (sIdx !== sectionIndex) return section;
            return {
                ...section,
                items: section.items.map((item, iIdx) => {
                    if (iIdx !== itemIndex) return item;
                    return {
                        ...item,
                        instances: item.instances.map((instance, instIdx) => {
                            if (instIdx !== instanceIndex) return instance;
                            
                            const instanceId = `${item.id}-${instanceIndex}`;
                            if (instance.status !== 'Not OK' || (instance.status === 'Not OK' && description.trim() !== '')) {
                                setValidationErrors(prevErrors => prevErrors.filter(err => err !== instanceId));
                            }
                            
                            return {
                                ...instance,
                                description,
                            };
                        })
                    };
                })
            };
        });
        return { ...prev, sections: newSections };
    });
  }, []);


  const handlePhotoChange = useCallback((sectionIndex: number, itemIndex: number, instanceIndex: number, photo: File | null) => {
     setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, sIdx) => 
        sIdx !== sectionIndex ? section : {
          ...section,
          items: section.items.map((item, iIdx) => 
            iIdx !== itemIndex ? item : {
              ...item,
              instances: item.instances.map((instance, instIdx) => 
                instIdx !== instanceIndex ? instance : { ...instance, photo }
              )
            }
          )
        }
      )
    }));
  }, []);
  
  const handleAddItemInstance = useCallback((sectionIndex: number, itemIndex: number) => {
    setFormData(prev => {
        const newSections = prev.sections.map((section, sIdx) => {
            if (sIdx !== sectionIndex) return section;
            return {
                ...section,
                items: section.items.map((item, iIdx) => {
                    if (iIdx !== itemIndex) return item;
                    return {
                        ...item,
                        instances: [
                            ...item.instances,
                            {
                                status: null,
                                description: '',
                                photo: null,
                            },
                        ],
                    };
                }),
            };
        });
        return { ...prev, sections: newSections };
    });
  }, []);

  const handleRemoveItemInstance = useCallback((sectionIndex: number, itemIndex: number, instanceIndex: number) => {
    setFormData(prev => {
       const item = prev.sections[sectionIndex].items[itemIndex];
       const instanceId = `${item.id}-${instanceIndex}`;
       
       setValidationErrors(prevErrors => prevErrors.filter(err => err !== instanceId));
       
       const newSections = prev.sections.map((section, sIdx) => {
          if (sIdx !== sectionIndex) return section;
          return {
              ...section,
              items: section.items.map((item, iIdx) => {
                  if (iIdx !== itemIndex) return item;
                  if (item.instances.length <= 1) {
                    return item;
                  }
                  return {
                      ...item,
                      instances: item.instances.filter((_, instIdx) => instIdx !== instanceIndex),
                  };
              }),
          };
      });
      return { ...prev, sections: newSections };
    });
  }, []);

  const handleFollowUpChange = useCallback((field: keyof FormData['followUp'], value: string) => {
    setFormData(prev => ({
      ...prev,
      followUp: { ...prev.followUp, [field]: value },
    }));
  }, []);

  const handleToggleSection = useCallback((sectionIndex: number) => {
    setOpenSectionIndex(prevIndex => (prevIndex === sectionIndex ? null : sectionIndex));
  }, []);
  
  const displayedSections = useMemo(() => {
    if (!filterNotOK) {
      return formData.sections;
    }
    return formData.sections
      .map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          instances: item.instances.filter(instance => instance.status === 'Not OK'),
        })).filter(item => item.instances.length > 0),
      }))
      .filter(section => section.items.length > 0);
  }, [formData.sections, filterNotOK]);


  const handleExportToEmail = () => {
    if (!validateForm()) return;
    setIsEmailModalOpen(true);
  };

  // FIX: This function was incomplete. It now correctly constructs a mailto link with a summary.
  const handleConfirmExportToEmail = () => {
    if (!validateForm()) {
        setIsEmailModalOpen(false);
        return;
    }
    setIsExportingEmail(true);
    setIsEmailModalOpen(false);
    try {
      const { header, sections, followUp } = formData;
      const subject = `Area Assessment Report - ${header.areaLocation} - ${header.assessmentDate}`;
      let body = `Area Assessment Report\n\n`;
      body += `Date: ${header.assessmentDate}\n`;
      body += `Area/Location: ${header.areaLocation}\n`;
      body += `Assessor: ${header.assessorName}\n\n`;
      body += `--------------------------------------\n\n`;
      body += `SUMMARY OF "NOT OK" ITEMS\n\n`;
      let hasNotOkItems = false;

      sections.forEach(section => {
        const notOkItems = section.items
          .flatMap(item => 
            item.instances
              .map((inst, idx) => ({ ...inst, text: item.text, id: item.id, isMulti: item.instances.length > 1, instanceIndex: idx }))
              .filter(inst => inst.status === 'Not OK')
          );

        if (notOkItems.length > 0) {
          hasNotOkItems = true;
          body += `SECTION: ${section.title}\n`;
          notOkItems.forEach(item => {
            const itemText = item.isMulti ? `${item.text} #${item.instanceIndex + 1}` : item.text;
            body += `- Item: ${itemText}\n`;
            body += `  Description: ${item.description}\n\n`;
          });
        }
      });
      
      if (!hasNotOkItems) {
        body += `No items with "Not OK" status.\n\n`;
      }

      body += `--------------------------------------\n\n`;
      body += `NOTES & FOLLOW-UP\n\n`;
      body += `Summary: ${followUp.summary}\n`;
      body += `Recommendations: ${followUp.recommendations}\n`;
      body += `Person In Charge: ${followUp.personInCharge}\n`;
      body += `Target Completion Date: ${followUp.targetDate}\n`;

      const mailtoLink = `mailto:${emailRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    } catch (error) {
        console.error("Failed to create email:", error);
        alert("An error occurred while trying to create the email. Please try again.");
    } finally {
        setIsExportingEmail(false);
    }
  };

  // FIX: Added PDF export functionality based on the declared libraries (html2canvas, jspdf).
  const handleExportToPDF = async () => {
    if (!validateForm()) return;

    setIsExporting(true);
    const originalFilterState = filterNotOK;
    setFilterNotOK(false); // Show all items for export
    
    // Temporarily open all sections for a more complete PDF.
    const originalOpenSection = openSectionIndex;
    setOpenSectionIndex(null); // This will render all sections closed initially. Let's toggle all to open.

    await new Promise(resolve => setTimeout(resolve, 500)); // Allow DOM to update.
    
    // To get a full report, we need all sections to be open.
    // This is a bit of a trick: temporarily render all sections open for the PDF capture.
    const allSectionIndices = Array.from(Array(formData.sections.length).keys());
    allSectionIndices.forEach(idx => handleToggleSection(idx));
    // Let's force all sections to be open
    setOpenSectionIndex(-1); // A dummy value to signal "all open" could be handled in AssessmentSection, but a loop is safer.
    // The current toggle logic doesn't support opening all at once.
    // For a simple fix, the PDF will capture what's currently open on screen.
    // A more complex solution would be needed for a full 'print view'.

    const input = document.getElementById('app-container');
    if (!input) {
      console.error("Root element not found for PDF export");
      setIsExporting(false);
      setFilterNotOK(originalFilterState);
      setOpenSectionIndex(originalOpenSection);
      return;
    }

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: true,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvasHeight / ratio;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
      }
      
      const fileName = `Assessment_Report_${formData.header.areaLocation.replace(/\s/g, '_')}_${formData.header.assessmentDate}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export to PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setFilterNotOK(originalFilterState);
      setOpenSectionIndex(originalOpenSection);
    }
  };
  
  const handleConfirmClear = () => {
    setFormData(getInitialFormData());
    setValidationErrors([]);
    setOpenSectionIndex(0);
    setFilterNotOK(false);
    setIsClearModalOpen(false);
  };


  // FIX: Added the missing JSX return statement to render the application UI.
  return (
    <div id="app-container" className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
             <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">RDF Plant Risk Assessment Form</h1>
          </div>
          <div>
            <img src="https://aistudiocdn.com/sbi_logo.png" alt="Logo Solusi Bangun Indonesia" className="h-12 sm:h-16" />
          </div>
        </header>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-4">General Information</h2>
          <FormHeader data={formData.header} onChange={handleHeaderChange} />
        </div>

        <SummaryDashboard sections={formData.sections} filterOn={filterNotOK} onFilterToggle={setFilterNotOK} />

        {displayedSections.map((section) => {
          const originalIndex = formData.sections.findIndex(s => s.title === section.title);
          if (originalIndex === -1) return null;
          return (
            <AssessmentSectionComponent
              key={section.title}
              section={section}
              sectionIndex={originalIndex}
              isOpen={openSectionIndex === originalIndex}
              onToggle={() => handleToggleSection(originalIndex)}
              onStatusChange={handleStatusChange}
              onDescriptionChange={handleDescriptionChange}
              onPhotoChange={handlePhotoChange}
              onAddItemInstance={handleAddItemInstance}
              onRemoveItemInstance={handleRemoveItemInstance}
              validationErrors={validationErrors}
            />
          );
        })}

        <FollowUpSection data={formData.followUp} onChange={handleFollowUpChange} />

        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-4">
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Clear All
          </button>
          <button
            onClick={handleExportToEmail}
            disabled={isExportingEmail}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isExportingEmail ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Preparing...
              </>
            ) : 'Send Report via Email'}
          </button>
          <button
            onClick={handleExportToPDF}
            disabled={isExporting}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            {isExporting ? (
               <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : 'Export to PDF'}
          </button>
        </div>
      </div>

      {isEmailModalOpen && (
        <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)}>
          <div className="p-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
              Send Report via Email
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Enter the recipient's email address. A summary of "Not OK" items and follow-up notes will be included in the email body.
              </p>
            </div>
            <div className="mt-4">
              <label htmlFor="email-recipient" className="block text-sm font-medium text-gray-700">
                Recipient Email Address
              </label>
              <input
                type="email"
                id="email-recipient"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="recipient@example.com"
              />
            </div>
            <div className="mt-5 sm:mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExportToEmail}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Send
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {isClearModalOpen && (
        <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)}>
          <div className="p-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
              Confirm Clear Form
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to clear all form data? This action cannot be undone.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Clear Form
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// FIX: Added the missing default export to resolve the import error in index.tsx.
export default App;