import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { files as filesApi, folders as foldersApi, system } from '../services/api';
import { Cloud, Folder, File, Upload, LogOut, HardDrive, Plus, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  const [folders, setFolders] = useState<any[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
    checkHealth();
  }, [currentFolder]);

  const checkHealth = async () => {
    try {
      const res = await system.health();
      setHealth(res);
    } catch (e) {
      console.error("Health check failed", e);
    }
  };

  const loadData = async () => {
    try {
      const f = await foldersApi.list(currentFolder);
      const docs = await filesApi.list(currentFolder);
      setFolders(f);
      setFileList(docs);
    } catch (e) {
      console.error("Failed to load data", e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolder) formData.append('folderId', currentFolder);
      
      await filesApi.upload(formData);
      await loadData();
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Make sure the storage is connected.");
    } finally {
      setUploading(false);
    }
  };

  const createFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;
    try {
      await foldersApi.create({ name, parentId: currentFolder });
      await loadData();
    } catch (e) {
      alert("Failed to create folder");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIconWrapper}>
            <Cloud className={styles.brandIcon} />
          </div>
          <h1 className={styles.brandName}>Home Cloud</h1>
        </div>

        <div className={styles.nav}>
          <button 
            onClick={() => setCurrentFolder(undefined)} 
            className={`${styles.navItem} ${!currentFolder ? styles.navItemActive : ''}`}
          >
            <Folder className={styles.navIcon} />
            My Files
          </button>
        </div>

        {health && (
          <div className={styles.healthWidget}>
            <div className={styles.healthTitle}>
              <HardDrive className={health.storage === 'connected' ? styles.healthIconConnected : styles.healthIconDisconnected} />
              <span>Storage</span>
            </div>
            <div className={styles.healthStatus}>
              {health.storage === 'connected' ? 'Online & Ready' : 'Disconnected'}
            </div>
          </div>
        )}

        <div className={styles.userProfile}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <span className={styles.userName}>{user?.name}</span>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className={styles.logoutBtn}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.bgDecoration3} />
        
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>My Files</h2>
          
          <div className={styles.actions}>
            <button onClick={createFolder} className={styles.btnSecondary}>
              <Plus className="w-4 h-4" />
              New Folder
            </button>
            <label className={styles.btnPrimary}>
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload File'}
              <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </header>

        <div className={styles.content}>
          {folders.length === 0 && fileList.length === 0 && (
            <div className={styles.emptyState}>
              <Folder className={styles.emptyIcon} />
              <p>This folder is empty</p>
            </div>
          )}

          <div className={styles.grid}>
            {folders.map(folder => (
              <div 
                key={folder.id} 
                onClick={() => setCurrentFolder(folder.id)}
                className={`${styles.cardItem} ${styles.folderCard}`}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIconWrapper} ${styles.folderIconWrapper}`}>
                    <Folder className="w-6 h-6" />
                  </div>
                </div>
                <h3 className={styles.cardTitle}>{folder.name}</h3>
              </div>
            ))}

            {fileList.map(file => (
              <div 
                key={file.id} 
                className={`${styles.cardItem} ${styles.fileCard}`}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIconWrapper} ${styles.fileIconWrapper}`}>
                    <File className="w-6 h-6" />
                  </div>
                  <div className={styles.cardActions}>
                    <a 
                      href={filesApi.downloadUrl(file.id)} 
                      download 
                      className={styles.actionBtn}
                      onClick={e => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        await filesApi.delete(file.id); 
                        loadData(); 
                      }} 
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className={styles.cardTitle} title={file.originalName}>{file.originalName}</h3>
                <p className={styles.cardMeta}>{formatBytes(file.size)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
