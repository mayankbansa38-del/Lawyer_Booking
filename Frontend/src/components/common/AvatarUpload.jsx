import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';

// HMR Force Update
export default function AvatarUpload({
    initialImage,
    size = 'md',
    editable = true,
    onUploadSuccess
}) {
    const { refreshUser } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(initialImage);
    const fileInputRef = useRef(null);

    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-20 h-20',
        lg: 'w-32 h-32',
        xl: 'w-40 h-40'
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            alert('File size must be less than 2MB');
            return;
        }

        try {
            setUploading(true);

            // Show local preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await userAPI.uploadAvatar(formData);

            // Refresh auth context
            await refreshUser();

            if (onUploadSuccess) {
                onUploadSuccess(response.data.avatar);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image. Please try again.');
            // Revert preview on error
            setPreview(initialImage);
        } finally {
            setUploading(false);
            // Clear input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="relative inline-block group">
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center relative`}>
                {preview ? (
                    <img
                        src={preview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <User className="w-1/2 h-1/2 text-gray-400" />
                )}

                {/* Uploading Overlay */}
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}
            </div>

            {/* Edit Button */}
            {editable && !uploading && (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm ring-2 ring-white"
                >
                    <Camera className="w-4 h-4" />
                </button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
            />
        </div>
    );
}
