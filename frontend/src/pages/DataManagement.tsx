import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { uploadsApi } from "../services/api";
import { motion } from "framer-motion";
import { Upload, FileText, Briefcase, Trash2, Eye, X } from "lucide-react";

interface Resume {
  id: number;
  filename: string;
  content: string;
  uploaded_at: string;
}

interface JobDescription {
  id: number;
  title: string;
  filename: string;
  content: string;
  uploaded_at: string;
}

export function DataManagement() {
  const [activeTab, setActiveTab] = useState<"resume" | "jd">("resume");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [loadingJDs, setLoadingJDs] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Resume | JobDescription | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingJD, setUploadingJD] = useState(false);
  const [jdTitle, setJdTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [showJDTextInput, setShowJDTextInput] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resumeFileRef = useRef<HTMLInputElement>(null);
  const jdFileRef = useRef<HTMLInputElement>(null);

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
    loadJobDescriptions();
  }, []);

  const loadResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await uploadsApi.getResumeHistory();
      setResumes(response.data.resumes);
      setError("");
    } catch (err) {
      console.error("Error loading resumes:", err);
      setError("Failed to load resumes");
    } finally {
      setLoadingResumes(false);
    }
  };

  const loadJobDescriptions = async () => {
    setLoadingJDs(true);
    try {
      const response = await uploadsApi.getJobDescriptionHistory();
      setJobDescriptions(response.data.job_descriptions);
      setError("");
    } catch (err) {
      console.error("Error loading job descriptions:", err);
      setError("Failed to load job descriptions");
    } finally {
      setLoadingJDs(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      await uploadsApi.uploadResume(file);
      setSuccess("Resume uploaded successfully!");
      await loadResumes();
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error uploading resume:", err);
      setError("Failed to upload resume");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUploadingResume(false);
      event.target.value = "";
    }
  };

  const handleJDUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !jdTitle.trim()) {
      setError("Please enter a title for the job description");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setUploadingJD(true);
    try {
      await uploadsApi.uploadJobDescription(file, jdTitle);
      setSuccess("Job description uploaded successfully!");
      setJdTitle("");
      await loadJobDescriptions();
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error uploading job description:", err);
      setError("Failed to upload job description");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUploadingJD(false);
      event.target.value = "";
    }
  };

  const handleSaveJDText = async () => {
    if (!jdTitle.trim() || !jdText.trim()) {
      setError("Please enter both title and content");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setUploadingJD(true);
    try {
      await uploadsApi.saveJobDescriptionText(jdTitle, jdText);
      setSuccess("Job description saved successfully!");
      setJdTitle("");
      setJdText("");
      setShowJDTextInput(false);
      await loadJobDescriptions();
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving job description:", err);
      setError("Failed to save job description");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUploadingJD(false);
    }
  };

  const handleDeleteResume = async (id: number) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      const response = await uploadsApi.deleteResume(id);
      console.log("Delete response:", response);
      setSuccess("Resume deleted successfully!");
      await loadResumes();
      setShowDetail(false);
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error deleting resume:", err);
      const errorMsg = err?.response?.data?.detail || err?.message || "Failed to delete resume";
      setError(errorMsg);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteJD = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job description?")) return;
    try {
      const response = await uploadsApi.deleteJobDescription(id);
      console.log("Delete response:", response);
      setSuccess("Job description deleted successfully!");
      await loadJobDescriptions();
      setShowDetail(false);
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error deleting job description:", err);
      const errorMsg = err?.response?.data?.detail || err?.message || "Failed to delete job description";
      setError(errorMsg);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Document Library</h1>
            <p className="text-slate-400">Upload and manage your resumes and job descriptions</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab("resume")}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === "resume"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <FileText className="inline mr-2" size={20} />
              Resumes
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab("jd")}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === "jd"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <Briefcase className="inline mr-2" size={20} />
              Job Descriptions
            </motion.button>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-green-900/20 border border-green-500 rounded-lg text-green-300">
              {success}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 border border-slate-600">
                <h2 className="text-xl font-bold text-white mb-4">
                  {activeTab === "resume" ? "Upload Resume" : "Add Job Description"}
                </h2>

                {activeTab === "resume" ? (
                  <div>
                    <button
                      onClick={() => resumeFileRef.current?.click()}
                      disabled={uploadingResume}
                      className="flex items-center justify-center w-full p-6 border-2 border-dashed border-slate-500 rounded-lg cursor-pointer hover:border-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                        <p className="text-slate-300">Click to upload resume</p>
                        <p className="text-sm text-slate-500 mt-1">PDF or DOCX</p>
                      </div>
                    </button>
                    <input
                      ref={resumeFileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx"
                      onChange={handleResumeUpload}
                      disabled={uploadingResume}
                    />
                    {uploadingResume && (
                      <p className="text-center text-blue-400 mt-4">Uploading...</p>
                    )}
                  </div>
                ) : (
                  <div>
                    {!showJDTextInput ? (
                      <div className="space-y-3">
                        <button
                          onClick={() => jdFileRef.current?.click()}
                          disabled={uploadingJD || !jdTitle.trim()}
                          className="flex items-center justify-center w-full p-6 border-2 border-dashed border-slate-500 rounded-lg cursor-pointer hover:border-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="text-center">
                            <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                            <p className="text-slate-300">Click to upload file</p>
                            <p className="text-sm text-slate-500 mt-1">PDF, DOCX, or TXT</p>
                          </div>
                        </button>
                        <input
                          ref={jdFileRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.docx,.txt"
                          onChange={handleJDUpload}
                          disabled={uploadingJD}
                        />
                        <input
                          type="text"
                          placeholder="JD Title"
                          value={jdTitle}
                          onChange={(e) => setJdTitle(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400"
                        />
                        <button
                          onClick={() => setShowJDTextInput(true)}
                          className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition"
                        >
                          + Add from Text
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="JD Title"
                          value={jdTitle}
                          onChange={(e) => setJdTitle(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400"
                        />
                        <textarea
                          placeholder="Paste job description here..."
                          value={jdText}
                          onChange={(e) => setJdText(e.target.value)}
                          rows={8}
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveJDText}
                            disabled={uploadingJD}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setShowJDTextInput(false);
                              setJdTitle("");
                              setJdText("");
                            }}
                            className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {uploadingJD && (
                      <p className="text-center text-blue-400 mt-4">Processing...</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* List Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 border border-slate-600">
                <h2 className="text-xl font-bold text-white mb-4">
                  {activeTab === "resume" ? `Recent Resumes (${resumes.length})` : `Saved Job Descriptions (${jobDescriptions.length})`}
                </h2>

                {activeTab === "resume" ? (
                  <div className="space-y-3">
                    {loadingResumes ? (
                      <p className="text-slate-400 text-center py-8">Loading resumes...</p>
                    ) : resumes.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">No resumes uploaded yet</p>
                    ) : (
                      resumes.map((resume) => (
                        <motion.div
                          key={resume.id}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 bg-slate-600/50 hover:bg-slate-600 rounded-lg border border-slate-500 transition group"
                        >
                          <div
                            className="flex justify-between items-start cursor-pointer"
                            onClick={() => {
                              setSelectedItem(resume);
                              setShowDetail(true);
                            }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText size={18} className="text-blue-400" />
                                <p className="font-semibold text-white truncate">{resume.filename}</p>
                              </div>
                              <p className="text-sm text-slate-400">{formatDate(resume.uploaded_at)}</p>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{truncateText(resume.content, 150)}</p>
                            </div>
                            <Eye size={18} className="text-slate-400 flex-shrink-0" />
                          </div>
                          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => {
                                setSelectedItem(resume);
                                setShowDetail(true);
                              }}
                              className="flex-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteResume(resume.id);
                              }}
                              className="flex-1 px-3 py-1 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition flex items-center justify-center gap-1"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loadingJDs ? (
                      <p className="text-slate-400 text-center py-8">Loading job descriptions...</p>
                    ) : jobDescriptions.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">No job descriptions saved yet</p>
                    ) : (
                      jobDescriptions.map((jd) => (
                        <motion.div
                          key={jd.id}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 bg-slate-600/50 hover:bg-slate-600 rounded-lg border border-slate-500 transition group"
                        >
                          <div
                            className="flex justify-between items-start cursor-pointer"
                            onClick={() => {
                              setSelectedItem(jd);
                              setShowDetail(true);
                            }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Briefcase size={18} className="text-amber-400" />
                                <p className="font-semibold text-white truncate">{jd.title}</p>
                              </div>
                              <p className="text-sm text-slate-400">{formatDate(jd.uploaded_at)}</p>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{truncateText(jd.content, 150)}</p>
                            </div>
                            <Eye size={18} className="text-slate-400 flex-shrink-0" />
                          </div>
                          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => {
                                setSelectedItem(jd);
                                setShowDetail(true);
                              }}
                              className="flex-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJD(jd.id);
                              }}
                              className="flex-1 px-3 py-1 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition flex items-center justify-center gap-1"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {showDetail && selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDetail(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {"title" in selectedItem ? selectedItem.title : selectedItem.filename}
                </h2>
                <p className="text-sm text-slate-400 mt-2">{formatDate(selectedItem.uploaded_at)}</p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-slate-600/50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
              <p className="text-slate-300 whitespace-pre-wrap">{selectedItem.content}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopyToClipboard(selectedItem.content)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() =>
                  "title" in selectedItem
                    ? handleDeleteJD(selectedItem.id)
                    : handleDeleteResume(selectedItem.id)
                }
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
