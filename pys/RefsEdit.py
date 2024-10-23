import sys
import os
import shutil
import Common
import RefsEdit_Common
from dotenv import load_dotenv
import RefsEdit_AI

BASE_PATH = '/home/ubuntu/new_express/downloads'


def load_environment(env_path=None):
    if env_path:
        load_dotenv(env_path)
    apikey = os.getenv('apikey')
    print(f"Loaded API Key: {apikey}")  # Debugging line
    return {
        'apikey': apikey
    }


def parse_file_url(file_url):
    print(f"Parsing file URL: {file_url}")  # Debugging line
    url_parts = file_url.split("/")
    my_site = url_parts[4]
    my_library, jid, aid = url_parts[5:8]
    my_file_name = url_parts[-1]
    my_dir = os.path.join(BASE_PATH)
    # Debugging line
    print(
        f"Parsed Values - Site: {my_site}, Library: {my_library}, JID: {jid}, AID: {aid}, File Name: {my_file_name}, Directory: {my_dir}")
    return my_site, my_library, jid, aid, my_file_name, my_dir


def setup_file_paths(my_dir, jid, aid, my_file_name):
    original_file = os.path.join(my_dir, my_file_name)
    revised_file = os.path.join(my_dir, f'{jid}-{aid}-RE.docx')
    compared_file = os.path.join(my_dir, f'{jid}-{aid}-compared.docx')
    # Debugging line
    print(
        f"Setup File Paths - Original: {original_file}, Revised: {revised_file}, Compared: {compared_file}")
    return original_file, revised_file, compared_file


def process_references(original_file, revised_file, compared_file, jid, aid, ref_style_name, api_key):
    def copy_file_with_name(src, dst):
        print(f"Copying file from {src} to {dst}")  # Debugging line
        shutil.copy2(src, dst)
        template_file = os.path.join(
            BASE_PATH, 'Templates', f'{"NameDateRefs" if ref_style_name in ["APA", "Chicago"] else "NumberedRefs"}_Template.dotx')
        print(f"Using template file: {template_file}")  # Debugging line
        # RefsEdit_Common.check_and_fetch_style(template_file, dst)

    copy_file_with_name(original_file, revised_file)
    print(original_file)
    text_paras, references = RefsEdit_Common.get_text_and_refs_from_docx(
        original_file)
    print(f"Total Text Paragraphs Count: {len(text_paras)}")
    print(f"Total References Count: {len(references)}")

    if True:  # CheckWithAI
        print(f"\nReference Style: {ref_style_name}")
        print("\nConnecting AI model for references editing")
        edited_refs = RefsEdit_AI.edit_refs(
            references, ref_style_name, api_key)
        print("\nHere are edited References:")
        print(edited_refs)
    else:
        edited_refs = references

    RefsEdit_Common.replace_refs_in_docx(
        revised_file, edited_refs, len(references))
    if os.path.exists(compared_file):
        # Debugging line
        print(f"Removing existing compared file: {compared_file}")
        os.remove(compared_file)
    print("Comparing word documents...")
    # RefsEdit_Common.compare_word_documents(
    #     original_file, revised_file, compared_file)


def main():
    file_url = sys.argv[1]
    env_path = sys.argv[2] if len(sys.argv) > 2 else None

    print("Loading environment variables...")  # Debugging line
    env_vars = load_environment(env_path)
    my_site, my_library, jid, aid, my_file_name, my_dir = parse_file_url(
        file_url)
    original_file, revised_file, compared_file = setup_file_paths(
        my_dir, jid, aid, my_file_name)

    print(f"mySite: {my_site}")
    print(f"myLibrary: {my_library}")
    print(f"JID: {jid}")
    print(f"AID: {aid}")

    data = Common.read_csv(os.path.join(
        BASE_PATH, f"{jid}-{aid}-metadata.csv"))
    print(f"Metadata: {data}")  # Debugging line
    tmplogfile = os.path.join(BASE_PATH, "logs", "typesetting.log")
    if os.path.exists(tmplogfile):
        print(f"Removing existing log file: {tmplogfile}")  # Debugging line
        os.remove(tmplogfile)

    print("Processing references...")
    process_references(original_file, revised_file, compared_file,
                       jid, aid, data['JrnlStyle'], env_vars['apikey'])


if __name__ == "__main__":
    main()
