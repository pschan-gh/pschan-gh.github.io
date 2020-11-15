<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xh="http://www.w3.org/1999/xhtml"
	xmlns:lv="http://www.math.cuhk.edu.hk/~pschan/cranach"
	xmlns:ltx="http://dlmf.nist.gov/LaTeXML"
	xmlns:idx = "http://www.math.cuhk.edu.hk/~pschan/elephas_index"
	xmlns:m = "http://www.w3.org/1998/Math/MathML"
	exclude-result-prefixes="xh"
	>


	<xsl:strip-space elements="xh:* lv:newcol lv:collapse lv:title lv:slide"/>
	<xsl:preserve-space elements="xh:pre xh:textarea lv:paragraphs"/>

	<xsl:output method="html" />

	<xsl:param name="timestamp" select="'0'" />
	<xsl:param name="contenturl" select="''" />

	<xsl:variable name="xh" select="'http://www.w3.org/1999/xhtml'"/>

	<xsl:template match="/">
		<xsl:apply-templates select="lv:document" />
	</xsl:template>

	<xsl:template match="lv:document">
		<xsl:call-template name="toc" />
		<xsl:apply-templates select="*" />
	</xsl:template>

	<xsl:template name="toc">
		<ul class="toc_src">
			<xsl:for-each select="lv:bare|lv:course|lv:chapter|lv:section|lv:subsection">
				<xsl:call-template name="toc_entry">
					<xsl:with-param name="course" select="ancestor::lv:course/@course"/>
					<xsl:with-param name="chapter" select="ancestor::lv:chapter/@chapter"/>
					<xsl:with-param name="section" select="ancestor::lv:section/@section"/>
					<xsl:with-param name="subsection" select="ancestor::lv:subsection/@subsection"/>
					<xsl:with-param name="counter" select="@num"/>
				</xsl:call-template>
			</xsl:for-each>
		</ul>
	</xsl:template>

	<xsl:template name="toc_entry">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:param name="section" select="@section"/>
		<xsl:param name="subsection" select="@subsection"/>
		<xsl:param name="counter" select="''"/>

		<xsl:variable name="dot">
			<xsl:choose>
				<xsl:when test="$counter!=''">
					<xsl:value-of select="'.'"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="''"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<li>
			<a href="#">
				<xsl:attribute name="class">
					<xsl:value-of select="local-name()"/>
				</xsl:attribute>
				<xsl:attribute name="course">
					<xsl:value-of select="$course"/>
				</xsl:attribute>
				<xsl:attribute name="chapter">
					<xsl:value-of select="$chapter"/>
				</xsl:attribute>
				<xsl:attribute name="section">
					<xsl:value-of select="$section"/>
				</xsl:attribute>
				<xsl:attribute name="subsection">
					<xsl:value-of select="$subsection"/>
				</xsl:attribute>
				<xsl:attribute name="{local-name()}">
					<xsl:value-of select="@num"/>
				</xsl:attribute>
				<xsl:if test="local-name()!='bare'">
					<span class="serial">
						<xsl:value-of select="concat(local-name(), ' ', $counter, ' ')"/>
					</span>
					<span class="title">
						<xsl:apply-templates select="lv:title//text()">
							<xsl:with-param name="course" select="ancestor::lv:course/@title"/>
							<xsl:with-param name="chapter" select="ancestor::lv:chapter/@num"/>
							<xsl:with-param name="section" select="ancestor::lv:section/@num"/>
							<xsl:with-param name="subsection" select="ancestor::lv:subsection/@num"/>
							<xsl:with-param name="subsubsection" select="ancestor::lv:subsubsection/@num"/>
							<xsl:with-param name="toc" select="'true'"/>
						</xsl:apply-templates>
					</span>
				</xsl:if>
			</a>
			<xsl:if test="local-name()='chapter'">
				<a target="_blank" style="margin-left:2px">
					<xsl:attribute name="href">
						<xsl:value-of select="concat($contenturl, '&amp;query=//lv:chapter[@num=', @num,']')"/>
					</xsl:attribute>
					<xsl:text>❏</xsl:text>
				</a>
			</xsl:if>
			<ul>
				<xsl:for-each select="lv:bare|lv:course|lv:chapter|lv:section|lv:subsection">
					<xsl:call-template name="toc_entry">
						<xsl:with-param name="course" select="ancestor::lv:course/@title"/>
						<xsl:with-param name="chapter" select="ancestor::lv:chapter/@num"/>
						<xsl:with-param name="section" select="ancestor::lv:section/@num"/>
						<xsl:with-param name="subsection" select="ancestor::lv:subsection/@num"/>
						<xsl:with-param name="counter" select="concat($counter, $dot, @num)"/>
					</xsl:call-template>
				</xsl:for-each>
			</ul>
		</li>
	</xsl:template>

	<!-- <xsl:template match="xh:*[not(self::xh:iframe) and not(self::xh:img) and not(self::xh:br) and not(self::xh:newline)]">
		<xsl:element name="{local-name()}" namespace="{$xh}">
			<xsl:copy-of select="@*[(name(.)!='environment') and (name(.)!='chapter_type')]"/>
			<xsl:apply-templates select="text()|comment()|*"/>
		</xsl:element>
	</xsl:template> -->
	<xsl:template match="xh:*[not(self::xh:iframe) and not(self::xh:img) and not(self::xh:br or self::xh:hr)]">
		<xsl:element name="{local-name()}" namespace="{$xh}">
			<xsl:copy-of select="@*[(name(.)!='environment') and (name(.)!='chapter_type')]"/>
			<xsl:apply-templates select="text()|comment()|*"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="xh:br">
		<br/>
	</xsl:template>
	<xsl:template match="xh:hr">
		<hr/>
	</xsl:template>

	<xsl:template match="lv:bare">
		<xsl:apply-templates select="*">
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="lv:course">
		<!-- <xsl:apply-templates select="lv:chapter|lv:section|lv:subsection|lv:subsubsection|lv:slides|lv:keywords"> -->
		<xsl:apply-templates select="lv:*[not(self::lv:title)]">
			<xsl:with-param name="course" select="@title"/>
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="lv:topic">
		<h2>
			<xsl:attribute name="metadata"/>
			<xsl:attribute name="wbtag">
				<xsl:value-of select="'topic'"/>
			</xsl:attribute>
			<xsl:attribute name="chapter">
				<xsl:value-of select="@chapter"/>
			</xsl:attribute>
			<xsl:apply-templates select="text()|xh:br"/>
		</h2>
	</xsl:template>

	<xsl:template match="lv:chapter">
		<xsl:param name="course" select="@course"/>
		<xsl:apply-templates select="lv:section|lv:subsection|lv:subsubsection|lv:slides|lv:keywords">
			<xsl:with-param name="course" select="$course"/>
			<xsl:with-param name="chapter" select="@num"/>
			<xsl:with-param name="chapter_type" select="@chapter_type"/>
			<xsl:with-param name="chapter_title" select="@title"/>
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="lv:section">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:param name="chapter_type" select="@chapter_type"/>
		<xsl:param name="chapter_title" select="@chapter_title"/>
		<xsl:variable name="section">
			<xsl:number level="any" count="lv:chapter//lv:section" from="lv:chapter"/>
		</xsl:variable>
		<xsl:apply-templates select="lv:subsection|lv:subsubsection|lv:slides">
			<xsl:with-param name="course" select="@course"/>
			<xsl:with-param name="chapter" select="@chapter"/>
			<xsl:with-param name="chapter_type" select="$chapter_type"/>
			<xsl:with-param name="chapter_title" select="$chapter_title"/>
			<xsl:with-param name="section" select="@num"/>
			<xsl:with-param name="section_title" select="@title"/>
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="lv:subsection">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:param name="chapter_type" select="@chapter_type"/>
		<xsl:param name="chapter_title" select="@chapter_title"/>
		<xsl:param name="section" select="@section"/>
		<xsl:param name="section_title" select="@section_title"/>
		<xsl:variable name="subsection">
			<xsl:number level="any" count="lv:section//lv:subsection" from="lv:section"/>
		</xsl:variable>
		<xsl:apply-templates select="lv:subsubsection|lv:slides">
			<xsl:with-param name="course" select="@course"/>
			<xsl:with-param name="chapter" select="@chapter"/>
			<xsl:with-param name="chapter_type" select="$chapter_type"/>
			<xsl:with-param name="chapter_title" select="$chapter_title"/>
			<xsl:with-param name="section" select="@section"/>
			<xsl:with-param name="section_title" select="$section_title"/>
			<xsl:with-param name="subsection" select="@num"/>
			<xsl:with-param name="subsection_title" select="@title"/>
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="lv:subsubsection">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:param name="chapter_type" select="@chapter_type"/>
		<xsl:param name="chapter_title" select="@chapter_title"/>
		<xsl:param name="section" select="@section"/>
		<xsl:param name="section_title" select="@section_title"/>
		<xsl:param name="subsection" select="@subsection"/>
		<xsl:param name="subsection_title" select="@subsection_title" />
		<xsl:variable name="subsubsection">
			<xsl:number level="any" count="lv:subsection//lv:subsubsection" from="lv:subsection"/>
		</xsl:variable>
		<xsl:apply-templates select="lv:slides">
			<xsl:with-param name="course" select="@course"/>
			<xsl:with-param name="chapter" select="@chapter"/>
			<xsl:with-param name="chapter_type" select="$chapter_type"/>
			<xsl:with-param name="chapter_title" select="$chapter_title"/>
			<xsl:with-param name="section" select="@section"/>
			<xsl:with-param name="section_title" select="$section_title"/>
			<xsl:with-param name="subsection" select="@subsection"/>
			<xsl:with-param name="subsection_title" select="$subsection_title"/>
			<xsl:with-param name="subsubsection" select="@num"/>
			<xsl:with-param name="subsubsection_title" select="@title"/>
		</xsl:apply-templates>
	</xsl:template>


	<xsl:template match="lv:slides">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:param name="chapter_type" select="@chapter_type"/>
		<xsl:param name="chapter_title" select="@chapter_title"/>
		<xsl:param name="section" select="@section"/>
		<xsl:param name="section_title" select="@section_title"/>
		<xsl:param name="subsection" select="@subsection"/>
		<xsl:param name="subsection_title" select="@subsection_title" />
		<xsl:param name="subsubsection" select="@subsubsection"/>
		<xsl:apply-templates select="lv:slide">
			<xsl:with-param name="course" select="$course"/>
			<xsl:with-param name="chapter" select="$chapter"/>
			<xsl:with-param name="chapter_type" select="$chapter_type"/>
			<xsl:with-param name="chapter_title" select="$chapter_title"/>
			<xsl:with-param name="section" select="$section"/>
			<xsl:with-param name="section_title" select="$section_title"/>
			<xsl:with-param name="subsection" select="$subsection"/>
			<xsl:with-param name="subsection_title" select="@title"/>
			<xsl:with-param name="subsubsection" select="$subsubsection"/>
			<xsl:with-param name="subsubsection_title" select="@title"/>
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="lv:slide">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:param name="chapter_type" select="@chapter_type"/>
		<xsl:param name="chapter_title" select="@chapter_title"/>
		<xsl:param name="section" select="@section"/>
		<xsl:param name="section_title" select="@section_title"/>
		<xsl:param name="subsection" select="@subsection"/>
		<xsl:param name="subsection_title" select="@subsection_title"/>
		<xsl:param name="subsubsection" select="@subsubsection"/>
		<xsl:param name="subsubsection_title" select="@subsubsection_title"/>
		<xsl:variable name="slide">
			<xsl:number format="1" level="any" count="lv:slide"/>
		</xsl:variable>
		<div class="slide collapsed tex2jax_ignore">
			<xsl:attribute name="id">
				<xsl:text>s</xsl:text>
				<xsl:value-of select="$slide"/>
			</xsl:attribute>
			<xsl:attribute name="slide">
				<xsl:value-of select="$slide"/>
			</xsl:attribute>
			<xsl:attribute name="canon_num">
				<xsl:value-of select="@canon_num"/>
			</xsl:attribute>
			<xsl:attribute name="course">
				<xsl:choose>
					<xsl:when test="@course">
						<xsl:value-of select="@course"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$course"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
			<xsl:attribute name="chapter_type">
				<xsl:choose>
					<xsl:when test="@chapter_type">
						<xsl:value-of select="@chapter_type"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$chapter_type"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
			<xsl:attribute name="chapter">
				<xsl:choose>
					<xsl:when test="@chapter">
						<xsl:value-of select="@chapter"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$chapter"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
			<xsl:attribute name="chapter_title">
				<xsl:value-of select="$chapter_title"/>
			</xsl:attribute>
			<xsl:attribute name="section">
				<xsl:value-of select="$section"/>
			</xsl:attribute>
			<xsl:attribute name="section_title">
				<xsl:value-of select="$section_title"/>
			</xsl:attribute>
			<xsl:attribute name="subsection">
				<xsl:value-of select="$subsection"/>
			</xsl:attribute>
			<xsl:attribute name="subsection_title">
				<xsl:value-of select="$subsection_title"/>
			</xsl:attribute>
			<xsl:attribute name="subsubsection">
				<xsl:value-of select="$subsubsection"/>
			</xsl:attribute>
			<xsl:attribute name="wbtag">
				<xsl:value-of select="@wbtag"/>
			</xsl:attribute>
			<div class="slide_container" wbtag="ignore">
				<div class="slide_number">
					<button class="plain_button slide_button">
						<!-- <xsl:copy-of select="@*[name()!='wbtag']"/> -->
						<xsl:text>Slide </xsl:text>
						<xsl:value-of select="$slide"/>
					</button>
				</div>
				<div class="separator" style="position:relative; width:100%; height:1.5em; text-align:center;" wbtag="ignore">
					<xsl:attribute name="slide">
						<xsl:value-of select="$slide"/>
					</xsl:attribute>
					<hr style="border-top:2px dotted pink" />
					<div style="position:absolute;top:-0.75em;left:0;width:100%;text-align:center">
						<a href="javascript:void(0)" style="font-size:1em;color:pink" class="slide_label">
							<!-- <xsl:value-of select="concat(' slide ', $slide, ' ')"/> -->
							<xsl:choose>
								<xsl:when test="@canon_num">
									<xsl:value-of select="concat(' slide ', @canon_num, ' ')"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="concat(' slide ', $slide, ' ')"/>
								</xsl:otherwise>
							</xsl:choose>
						</a>
					</div>
					<div style="margin-top:-0.75em">
						<button href="#" class="plain_button collapse_icon" style="float:right" wbtag="ignore">
							<xsl:attribute name="onclick">
								<xsl:value-of select="concat('event.stopPropagation();collapseToggle(', $slide, ')')"/>
							</xsl:attribute>
							<i class="material-icons">unfold_more</i>
							<!-- <xsl:value-of select="'&#x21f3;'"/> -->
						</button>
					</div>
				</div>
				<div class="slide_content">
					<xsl:apply-templates select="*">
						<xsl:with-param name="context" select="'inline'"/>
						<xsl:with-param name="course" select="@course"/>
						<xsl:with-param name="chapter" select="@chapter"/>
						<xsl:with-param name="chapter_type" select="$chapter_type"/>
						<xsl:with-param name="chapter_title" select="$chapter_title"/>
						<xsl:with-param name="section" select="$section"/>
						<xsl:with-param name="section_title" select="$section_title"/>
						<xsl:with-param name="subsection" select="$subsection"/>
						<xsl:with-param name="subsection_title" select="@title"/>
						<xsl:with-param name="subsubsection" select="$subsubsection"/>
						<xsl:with-param name="subsubsection_title" select="@title"/>
						<xsl:with-param name="slide" select="$slide"/>
					</xsl:apply-templates>
				</div>
			</div>
		</div>
	</xsl:template>

	<xsl:template match="lv:figure">
		<xsl:variable name="chapter">
			<xsl:choose>
				<xsl:when test="ancestor::chapter">
					<xsl:value-of select="ancestor::lv:chapter/@num"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@chapter"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="num">
			<xsl:choose>
				<xsl:when test="ancestor::chapter">
					<xsl:number level="any"  count="lv:chapter[@num=$chapter]//lv:figure"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@num"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="item">
			<xsl:choose>
				<xsl:when test="ancestor::chapter">
					<xsl:choose>
						<xsl:when test="ancestor::lv:chapter/@no_serial">
							<xsl:value-of select="@item"/>

						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="concat(ancestor::lv:chapter/@num, '.', $num)"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@item"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<p wbtag="ignore"/>
		<div class='image'>
			<xsl:attribute name="class">
				<xsl:text>image</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="wbtag">
				<xsl:value-of select="@wbtag"/>
			</xsl:attribute>
			<xsl:attribute name="wbname">
				<xsl:value-of select="name()"/>
			</xsl:attribute>
			<xsl:attribute name="item">
				<xsl:value-of select="$item"/>
			</xsl:attribute>
			<xsl:apply-templates select="lv:label"/>
			<xsl:apply-templates select="*[not(self::lv:caption) and not(self::lv:label)]"/>
			<xsl:apply-templates select="lv:caption">
				<xsl:with-param name="item" select="$item"/>
			</xsl:apply-templates>
		</div>
	</xsl:template>

	<xsl:template match="lv:caption">
		<xsl:param name="item" select="''"/>
		<small class="caption">
			<xsl:attribute name="wbtag">
				<xsl:value-of select="'caption'"/>
			</xsl:attribute>
			<xsl:value-of select="concat('Figure ', ancestor::lv:figure/@item, ' ')"/>
			<xsl:apply-templates select="text()"/>
		</small>
	</xsl:template>

	<xsl:template match="lv:statement">
		<xsl:variable name="chapter">
			<xsl:choose>
				<xsl:when test="ancestor::chapter">
					<xsl:value-of select="ancestor::lv:chapter/@num"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@chapter"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="num">
			<xsl:choose>
				<xsl:when test="ancestor::chapter">
					<xsl:number level="any"  count="lv:chapter[@num=$chapter]//lv:statement"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@num"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="item">
			<xsl:choose>
				<xsl:when test="ancestor::lv:chapter">
					<xsl:choose>
						<xsl:when test="ancestor::lv:chapter/@no_serial">
							<xsl:value-of select="$num"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="concat(ancestor::lv:chapter/@num, '.', $num)"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@item"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<p wbtag="ignore"/>
		<div>
			<xsl:copy-of select="@*"/>
			<xsl:attribute name="class">
				<xsl:text>statement</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="wbtag">
				<xsl:value-of select="@wbtag"/>
			</xsl:attribute>
			<xsl:attribute name="wbname">
				<xsl:value-of select="name()"/>
			</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="concat('item', $item)"/>
			</xsl:attribute>
			<xsl:attribute name="item">
				<xsl:value-of select="$item"/>
			</xsl:attribute>
			<xsl:attribute name="type">
				<xsl:value-of select="@type"/>
			</xsl:attribute>
			<button class="plain_button item_button" onmouseover="this.style.backgroundColor=''" onmouseout="this.style.backgroundColor=''">
				<xsl:copy-of select="@*"/>
				<xsl:attribute name="wbtag">
					<xsl:value-of select="'transparent'"/>
				</xsl:attribute>
				<xsl:element name="h5">
					<xsl:attribute name="class">item_title</xsl:attribute>
					<xsl:attribute name="wbtag">ignore</xsl:attribute>
					<xsl:choose>
						<xsl:when test="not(@typerefnum)">
							<xsl:value-of select="@type"/>
							<span wbtag="ignore">
								<xsl:value-of select="concat(' ', $item, ' ')"/>
							</span>
						</xsl:when>
						<xsl:otherwise>
							<span style="padding-right:0.5em" wbtag="ignore">
								<xsl:value-of select="concat(' ', @typerefnum, ' ')"/>
							</span>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:element>
			</button>
			<xsl:apply-templates select="lv:label"/>
			<xsl:apply-templates select="lv:title"/>
			<blockquote wbtag="skip">
				<xsl:apply-templates select="*[not(self::lv:title) and not(self::lv:label)]"/>
			</blockquote>
		</div>
	</xsl:template>

	<xsl:template match="lv:label">
		<span wbtag="label" style="display:none">
			<xsl:copy-of select="@*"/>
		</span>
	</xsl:template>

	<!-- <xsl:template match="lv:statement/lv:title[text()!='.']"> -->
	<xsl:template match="lv:statement/lv:title">
		<div style="display:inline-block">
			<xsl:copy-of select="@*"/>
			<xsl:attribute name="wbtag">
				<xsl:value-of select="'transparent'"/>
			</xsl:attribute>
			<strong wbtag="ignore">&#160;-&#160;</strong>
			<xsl:element name="h5">
				<xsl:attribute name="wbtag">title</xsl:attribute>
				<xsl:apply-templates select="*[not(self::lv:label)]|text()"/>
			</xsl:element>
		</div>
	</xsl:template>

	<xsl:template match="lv:statement/lv:title[text()='.']" />

	<xsl:template match="lv:substatement">
		<div>
			<xsl:attribute name="class">
				<xsl:text>substatement</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="wbtag">
				<xsl:value-of select="@wbtag"/>
			</xsl:attribute>
			<xsl:attribute name="wbname">
				<xsl:value-of select="name()"/>
			</xsl:attribute>
			<xsl:attribute name="type">
				<xsl:value-of select="@type"/>
			</xsl:attribute>
			<xsl:copy-of select="@*"/>
			<blockquote wbtag="skip">
				<xsl:element name="h5">
					<xsl:attribute name="wbtag">ignore</xsl:attribute>
					<xsl:attribute name="class">item_title</xsl:attribute>
					<xsl:value-of select="@type"/>
					<xsl:if test="lv:title">
						<xsl:value-of select="'&#160;'"/>
						<xsl:apply-templates select="lv:title"/>
					</xsl:if>
					<xsl:value-of select="'.'"/>
				</xsl:element>
				<xsl:apply-templates select="*[not(self::lv:title) and not(self::lv:label)]"/>
			</blockquote>
		</div>
	</xsl:template>

	<xsl:template match="lv:title[@scope='course']">
		<h1 class="course_title">
			<xsl:attribute name="wbtag">
				<xsl:value-of select="'course'"/>
			</xsl:attribute>
			<xsl:attribute name="type">
				<xsl:value-of select="'Course'"/>
			</xsl:attribute>
			<xsl:attribute name="course">
				<xsl:value-of select="@title"/>
			</xsl:attribute>
			<span wbtag="title" class="title">
				<xsl:apply-templates select="text()"/>
			</span>
		</h1>
	</xsl:template>

	<xsl:template match="lv:title[@scope='chapter']">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:choose>
			<xsl:when test="ancestor::lv:chapter/@no_serial">
				<h2 class="chapter_title title">
					<span wbtag="title" class="title">
						<xsl:apply-templates select="text()|*"/>
					</span>
				</h2>
				<xsl:apply-templates select="ancestor::*/lv:label"/>
			</xsl:when>
			<xsl:otherwise>
				<h2 class="chapter_title title">
					<xsl:attribute name="serial">
						<xsl:value-of select="ancestor::lv:chapter/@num"/>
					</xsl:attribute>
					<xsl:attribute name="wbtag">
						<xsl:value-of select="@wbtag"/>
					</xsl:attribute>
					<xsl:attribute name="type">
						<xsl:value-of select="ancestor::lv:chapter/@chapter_type"/>
					</xsl:attribute>
					<xsl:attribute name="chapter">
						<xsl:value-of select="@chapter"/>
					</xsl:attribute>
					<span class="type">
						<xsl:value-of select="ancestor::lv:chapter/@chapter_type"/>
					</span>
					<xsl:text> </xsl:text>
					<span class="num">
						<xsl:value-of select="ancestor::lv:chapter/@num"/>
					</span>
					<br wbtag="ignore"/>
					<span wbtag="title" class="title">
						<xsl:apply-templates select="text()|*"/>
					</span>
				</h2>
				<xsl:apply-templates select="ancestor::*/lv:label"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="lv:topic[@scope='chapter']">
		<h3 class="topic">
			<xsl:copy-of select="@*" />
			<xsl:attribute name="wbtag">
				<xsl:value-of select="'topic'"/>
			</xsl:attribute>
			<xsl:attribute name="chapter">
				<xsl:value-of select="ancestor::lv:chapter/@num"/>
			</xsl:attribute>
			<xsl:apply-templates select="text()"/>
		</h3>
	</xsl:template>

	<xsl:template match="lv:title[@scope='section']">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:param name="chapter_type" select="@chapter_type"/>
		<xsl:param name="chapter_title" select="@chapter_title"/>
		<xsl:param name="section" select="@section"/>
		<xsl:param name="section_title" select="@section_title"/>
		<h3 wbtag="section" class="title">
			<xsl:variable name="serial">
				<xsl:value-of select="$chapter"/>
				<xsl:text>.</xsl:text>
				<xsl:value-of select="$section"/>
			</xsl:variable>
			<xsl:attribute name="serial">
				<xsl:value-of select="$serial"/>
			</xsl:attribute>
			<xsl:attribute name="type">
				<xsl:value-of select="'Section'"/>
			</xsl:attribute>
			<xsl:value-of select="$chapter"/>
			<xsl:text>.</xsl:text>
			<xsl:value-of select="$section"/>
			<xsl:text> </xsl:text>
			<span wbtag="title" class="title">
				<xsl:apply-templates select="*|text()"/>
			</span>
		</h3>
		<xsl:apply-templates select="ancestor::*/lv:label"/>
	</xsl:template>
	<xsl:template match="lv:title[@scope='subsection']">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:param name="chapter_type" select="@chapter_type"/>
		<xsl:param name="chapter_title" select="@chapter_title"/>
		<xsl:param name="section" select="@section"/>
		<xsl:param name="section_title" select="@section_title"/>
		<xsl:param name="subsection" select="@subsection"/>
		<xsl:param name="subsection_title" select="@subsection_title"/>
		<h4 wbtag="subsection" class="title">
			<xsl:variable name="serial">
				<xsl:value-of select="$chapter"/>
				<xsl:text>.</xsl:text>
				<xsl:value-of select="$section"/>
				<xsl:text>.</xsl:text>
				<xsl:value-of select="$subsection"/>
			</xsl:variable>
			<xsl:attribute name="serial">
				<xsl:value-of select="$serial"/>
			</xsl:attribute>
			<xsl:value-of select="$serial"/>
			<xsl:text> </xsl:text>
			<span wbtag="title" class="title">
				<xsl:apply-templates select="text()|*"/>
			</span>
		</h4>
		<xsl:apply-templates select="ancestor::*/lv:label"/>
	</xsl:template>

	<xsl:template match="lv:title[@scope='subsubsection']">
		<xsl:param name="course" select="@course"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:param name="chapter_type" select="@chapter_type"/>
		<xsl:param name="chapter_title" select="@chapter_title"/>
		<xsl:param name="section" select="@section"/>
		<xsl:param name="section_title" select="@section_title"/>
		<xsl:param name="subsection" select="@subsection"/>
		<xsl:param name="subsection_title" select="@subsection_title"/>
		<xsl:param name="subsubsection" select="@subsubsection"/>
		<xsl:param name="subsubsection_title" select="@subsubsection_title"/>
		<h5 wbtag="subsubsection" class="title">
			<xsl:variable name="serial">
				<xsl:value-of select="$chapter"/>
				<xsl:text>.</xsl:text>
				<xsl:value-of select="$section"/>
				<xsl:text>.</xsl:text>
				<xsl:value-of select="$subsection"/>
				<xsl:text>.</xsl:text>
				<xsl:value-of select="$subsubsection"/>
			</xsl:variable>
			<xsl:attribute name="serial">
				<xsl:value-of select="$serial"/>
			</xsl:attribute>
			<span wbtag="title" class="title">
				<xsl:apply-templates select="text()|*"/>
			</span>
		</h5>
		<xsl:apply-templates select="ancestor::*/lv:label"/>
		<br/>
	</xsl:template>

	<xsl:template match="lv:href">
		<xsl:element name="a">
			<xsl:copy-of select="@*"/>
			<xsl:attribute name="target">
				<xsl:text>_blank</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="href">
				<xsl:value-of select="@src"/>
			</xsl:attribute>
			<xsl:value-of select="@name"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="lv:ref">
		<xsl:element name="a">
			<xsl:copy-of select="@*"/>
			<xsl:attribute name="src-chapter">
				<xsl:value-of select="@src-chapter"/>
			</xsl:attribute>
			<xsl:attribute name="item">
				<xsl:value-of select="@item"/>
			</xsl:attribute>
			<xsl:attribute name="type">
				<xsl:value-of select="@type"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:choose>
					<xsl:when test="@type!='Section'">
						<xsl:text>lcref</xsl:text>
					</xsl:when>
					<xsl:otherwise>
						<xsl:text>href</xsl:text>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
			<xsl:if test="@type='Section'">
				<xsl:value-of select="concat('Section ', @serial, ' (')"/>
			</xsl:if>
			<xsl:choose>
				<xsl:when test="@name">
					<xsl:value-of select="@name" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates select="lv:title"/>
				</xsl:otherwise>
			</xsl:choose>
			<xsl:if test="@type='Section'">
				<xsl:value-of select="')'"/>
			</xsl:if>
		</xsl:element>
	</xsl:template>

	<xsl:template match="lv:keywords">
		<xsl:param name="slide" select="'all'"/>
		<xsl:param name="chapter" select="@chapter"/>
		<xsl:element name="div">
			<xsl:copy-of select="@*"/>
			<xsl:attribute name="class">
				<xsl:value-of select="name()"/>
			</xsl:attribute>
			<xsl:attribute name="wbtag">
				<xsl:text>ignore</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="chapter">
				<xsl:value-of select="$chapter"/>
			</xsl:attribute>
			<xsl:attribute name="course">
				<xsl:value-of select="@course"/>
			</xsl:attribute>
			<xsl:attribute name="slide">
				<xsl:value-of select="$slide"/>
			</xsl:attribute>
			<xsl:comment/>
			<xsl:apply-templates select="lv:keyword[not(.=preceding-sibling::lv:keyword)]">
				<xsl:with-param name="slide" select="$slide"/>
			</xsl:apply-templates>
		</xsl:element>
	</xsl:template>

	<xsl:template match="lv:toc">
		<h5>
			<xsl:value-of select="concat(@chapter_type, ' ', @num)"/>
		</h5>
	</xsl:template>

	<xsl:template match="lv:keyword">
		<xsl:param name="slide" select="'all'"/>
		<button class="btn btn-outline-info btn-sm btn_keyword" style="margin-left:5px;margin-top:5px" data-html="true" data-container="body" data-toggle="popover"  data-placement="bottom" slide="{$slide}">
			<xsl:attribute name="wbtag">
				<xsl:text>ignore</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="src">
				<xsl:value-of select="text()"/>
			</xsl:attribute>
			<xsl:variable name="apos">&apos;</xsl:variable>
			<xsl:variable name="keyword">
				<xsl:value-of select="text()"/>
			</xsl:variable>
			<xsl:for-each select="//lv:keyword[@chapter=./@chapter][@slide!='all'][text()=$keyword]">
				<a class="dropdown-item hidden" href="javascript:void(0)">
					<xsl:attribute name="slide">
						 <xsl:value-of select="@slide"/>
					</xsl:attribute>
					<xsl:attribute name="onclick">
						 <xsl:value-of select="concat('focusOn(', @slide , ',&quot;' , $keyword , '&quot;)')"/>
					</xsl:attribute>
					<xsl:value-of select="concat('Slide ', @slide)"/>
				</a>
			</xsl:for-each>
			<xsl:value-of select="$keyword"/>
		</button>
	</xsl:template>

	<xsl:template match="lv:wiki">
		<xsl:element name="div">
			<xsl:attribute name="class">
				<xsl:value-of select="name()"/>
			</xsl:attribute>
			<xsl:value-of select="."/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="lv:inline_keyword">
		<b wbtag="keyword">
			<xsl:value-of select="."/>
		</b>
	</xsl:template>

	<xsl:template match="lv:hc_keyword">
		<b class="hidden">
			<xsl:copy-of select="@*"/>
			<xsl:value-of select="."/>
		</b>
	</xsl:template>

	<xsl:template match="lv:setchapter">
		<span class="hidden">
			<xsl:copy-of select="@*"/>
		</span>
	</xsl:template>

	<!-- <xsl:template match="lv:newcol|lv:collapse|*[@wbtag='newcol']|*[@wbtag='collapse']"> -->
	<xsl:template match="lv:newcol|lv:collapse">
		<xsl:variable name="col">
			<xsl:number level="any" count="lv:newcol|lv:collapse"/>
		</xsl:variable>
		<xsl:variable name="id">
			<xsl:value-of select="concat('c', $timestamp, $col)" />
		</xsl:variable>
		<!-- <a class="collapsea collapsed" contenteditable="false" data-toggle="collapse" aria-expanded="false" wbtag="ignore" xmlns="http://www.w3.org/1999/xhtml"> -->
		<a class="collapsea collapsed" contenteditable="false" data-toggle="collapse" aria-expanded="false" wbtag="ignore">
			<xsl:attribute name="aria-controls">
				<xsl:value-of select="$id"/>
			</xsl:attribute>
			<xsl:attribute name="href">
				<xsl:value-of select="concat('#', $id)" />
				<!-- <xsl:value-of select="'#'" /> -->
			</xsl:attribute>
			<!-- ► -->
		</a>
		<div class="collapse" xmlns="http://www.w3.org/1999/xhtml">
			<xsl:attribute name="id">
				<xsl:value-of select="$id"/>
			</xsl:attribute>
			<xsl:attribute name="wbtag">
				<xsl:value-of select="@wbtag"/>
			</xsl:attribute>
			<xsl:apply-templates select="*" />
		</div>
	</xsl:template>

	<xsl:template match="xh:iframe|xh:img">
		<xsl:element name="{local-name()}" namespace="{$xh}">
			<xsl:copy-of select="@*[(name(.)!='src') and (name(.)!='environment')]"/>
			<xsl:if test="@src">
				<xsl:attribute name="data-src">
					<xsl:value-of select="@src"/>
				</xsl:attribute>
			</xsl:if>
			<xsl:attribute name="rendered">0</xsl:attribute>
			<xsl:apply-templates select="text()|comment()|*"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="xh:li">
		<xsl:element name="{local-name()}" namespace="{$xh}">
			<xsl:copy-of select="@*[(name(.)!='environment') and (name(.)!='chapter_type')]"/>
			<!-- <xsl:apply-templates select="text()|comment()|*[not(self::lv:paragraphs)]|lv:paragraphs/text()"/> -->
			<xsl:apply-templates select="text()|comment()|*"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="lv:math">
		<!-- <xsl copy-of select="current()"/> -->
		<xsl:element name="{name()}">
			<xsl:copy-of select="@*"/>
			<xsl:copy-of select="node()"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="lv:framebox">
		<div style="width:100%;text-align:center">
			<xsl:copy-of select="@wbtag"/>
			<div class="framebox">
				<xsl:apply-templates select="text()|comment()|*"/>
			</div>
		</div>
	</xsl:template>

	<xsl:template match="lv:center">
		<div style="display:table;width:100%;text-align:center;margin:auto" class="center">
			<xsl:copy-of select="@wbtag"/>
			<xsl:apply-templates select="text()|comment()|*"/>
		</div>
	</xsl:template>

	<xsl:template match="lv:left">
		<div style="display:table-cell;vertical-align:middle;width:50%;text-align:center" class="dual-left">
			<xsl:copy-of select="@wbtag"/>
			<xsl:apply-templates select="text()|comment()|*"/>
		</div>
	</xsl:template>

	<xsl:template match="lv:right">
		<div style="display:table-cell;vertical-align:middle;width:50%;text-align:center" class="dual-right">
			<xsl:copy-of select="@wbtag"/>
			<xsl:apply-templates select="text()|comment()|*"/>
		</div>
	</xsl:template>

	<xsl:template match="lv:qed">
		<div style='width:100%;text-align:right;color:#428bc1' wbtag="qed">&#x25fc;&#xFE0E;</div>
	</xsl:template>


	<xsl:template match="lv:col_ul">
		<ul wbtag="col_ul">
			<!-- <xsl:copy-of select="@*"/> -->
			<xsl:apply-templates select="lv:col_li"/>
		</ul>
	</xsl:template>

	<xsl:template match="lv:col_ol">
		<ol wbtag="col_ol">
			<!-- <xsl:copy-of select="@*"/> -->
			<xsl:apply-templates select="lv:col_li"/>
		</ol>
	</xsl:template>
	<xsl:template match="lv:col_li">
		<xsl:variable name="li">
			<xsl:number format="1" level="any" count="lv:col_li"/>
		</xsl:variable>
		<li wbtag="skip">
			<xsl:variable name="id">
				<xsl:value-of select="concat('s', $timestamp, $li)" />
			</xsl:variable>
			<a class="collapsea collapsed" contenteditable="false" data-toggle="collapse" aria-expanded="false" wbtag="ignore">
				<xsl:attribute name="aria-controls"><xsl:value-of select="$id" /></xsl:attribute>
				<xsl:attribute name="href">#<xsl:value-of select="$id" /></xsl:attribute>
				<!-- <xsl:attribute name="href">#</xsl:attribute> -->
				<!-- ► -->
			</a>
			<div class="collapse">
				<xsl:attribute name="id"><xsl:value-of select="$id" /></xsl:attribute>
				<xsl:attribute name="wbtag">
					<xsl:value-of select="@wbtag"/>
				</xsl:attribute>
				<xsl:apply-templates select="*" />
			</div>
		</li>
	</xsl:template>

	<xsl:template match="lv:steps">
		<div wbtag="steps">
			<xsl:apply-templates select="*|text()" />
			<div style="text-align:right" wbtag="ignore">
				<button class="btn btn-outline-info btn-sm next">
					<xsl:attribute name="onclick">
						<!-- <xsl:value-of select="concat('showStep(&quot;', @stepsid, '&quot;)')" /> -->
						<xsl:value-of select="'showStep(this)'" />
					</xsl:attribute>
					<xsl:attribute name="id">
						<xsl:value-of select="concat('next', @stepsid)" />
					</xsl:attribute>
					next
				</button>
				<button class="btn btn-outline-info btn-sm reset" style="margin-left:5px" disabled="true">
					<xsl:attribute name="onclick">
						<!-- <xsl:value-of select="concat('resetSteps(&quot;', @stepsid, '&quot;)')" /> -->
						<xsl:value-of select="'resetSteps(this)'" />
					</xsl:attribute>
					<xsl:attribute name="id">
						<xsl:value-of select="concat('reset', @stepsid)" />
					</xsl:attribute>
					reset
				</button>
			</div>
		</div>
	</xsl:template>

	<!-- <xsl:template match="lv:newline|xh:newline|newline"> -->
	<xsl:template match="lv:newline">
		<br wbtag="newline"/>
	</xsl:template>


	<xsl:template match="lv:para">
		<div wbtag="para">
			<xsl:apply-templates select="*|text()"/>
		</div>
	</xsl:template>

	<xsl:template match="lv:webwork">
		<div>
			<xsl:attribute name="class">
				<xsl:text>webwork</xsl:text>
			</xsl:attribute>
			<xsl:copy-of select="@*"/>
			<strong class="webwork_label print">WeBWorK</strong>
			<div class="ww" style="overflow:auto">
				<xsl:attribute name="id">
					<xsl:value-of select="concat('ww_inner_', @ww_id)" />
				</xsl:attribute>
				<div style="text-align:center;overflow-y:hidden;height:3.5cm;width:5cm" class="loading_icon"><img class="exempt" style="height:3.5cm" src="icons/Loading_icon.gif"/><br/><div style="margin-top:-2.25cm" class="text-muted">Click to Load.</div></div>
				<iframe style="overflow-x:auto;overflow-y:hidden;display:none" class="webwork">
					<xsl:attribute name="rendered">0</xsl:attribute>
					<xsl:attribute name="data-src">
						<xsl:value-of select="concat('https://webwork.math.cuhk.edu.hk/webwork2/html2xml?sourceFilePath=',@pg_file, '&amp;answersSubmitted=0&amp;problemSeed=123567890&amp;displayMode=MathJax&amp;courseID=daemon_course&amp;userID=daemon&amp;course_password=daemon&amp;outputformat=simple')"/>
					</xsl:attribute>
				</iframe>
			</div>
		</div>
	</xsl:template>

	<xsl:template match="lv:image">
		<xsl:element name="div">
			<xsl:attribute name="class">
				<xsl:text>image</xsl:text>
			</xsl:attribute>
			<xsl:copy-of select="@*[name(.)!='src']"/>
			<xsl:element name="img">
				<xsl:attribute name="wbtag">ignore</xsl:attribute>
				<xsl:copy-of select="@*[name(.)!='src']"/>
				<xsl:attribute name="rendered">0</xsl:attribute>
			</xsl:element>
		</xsl:element>
	</xsl:template>

	<xsl:template match="lv:paragraphs">
		<span class="paragraphs">
			<xsl:value-of select="text()" disable-output-escaping="yes"/>
		</span>
	</xsl:template>
	
	<xsl:template match="lv:comment">
		<div class="comment">
			<xsl:value-of select="text()" disable-output-escaping="yes"/>
		</div>
	</xsl:template>

	<xsl:template match="lv:enumerate">
		<xsl:param name="context" select="''"/>
		<xsl:text>&#x0A;</xsl:text>
		<xsl:element name="ol" namespace="{$xh}">
			<xsl:copy-of select="@wbtag"/>
			<!-- <xsl:if test="$context!='enumerate'">
			<xsl:attribute name="type">1|a|i</xsl:attribute>
		    </xsl:if> -->
			<xsl:apply-templates select="lv:item">
				<xsl:with-param name="context" select="local-name()"/>
			</xsl:apply-templates>
		</xsl:element>
		<xsl:text>&#x0A;</xsl:text>
	</xsl:template>

	<xsl:template match="lv:itemize">
		<xsl:param name="context" select="''"/>
		<xsl:text>&#x0A;</xsl:text>
		<xsl:element name="ul" namespace="{$xh}">
			<xsl:copy-of select="@wbtag"/>
			<xsl:apply-templates select="lv:item">
				<xsl:with-param name="context" select="local-name()"/>
			</xsl:apply-templates>
		</xsl:element>
		<xsl:text>&#x0A;</xsl:text>
	</xsl:template>

	<xsl:template match="lv:item">
		<xsl:param name="context" select="''"/>
		<xsl:text>&#x0A;</xsl:text>
		<xsl:element name="li" namespace="{$xh}">
			<xsl:copy-of select="@wbtag"/>
			<xsl:apply-templates select="*">
				<xsl:with-param name="context" select="$context"/>
			</xsl:apply-templates>
		</xsl:element>
		<xsl:text>&#x0A;</xsl:text>
	</xsl:template>

<xsl:template match="lv:escaped">
	<xsl:element name="span" namespace="{$xh}">
		<xsl:copy-of select="@*"/>
		<xsl:attribute name="class">
			<xsl:value-of select="'escaped'"/>
		</xsl:attribute>
		<xsl:value-of select="concat('@', @argument)"/>
	</xsl:element>
</xsl:template>

<xsl:template match="m:math">
	<xsl:element name="math" namespace="http://www.w3.org/1998/Math/MathML">
		<xsl:copy-of select="@*"/>
		<xsl:copy-of select="*"/>
	</xsl:element>
</xsl:template>

<xsl:template match="text()">
	<xsl:value-of select="." disable-output-escaping="yes" />
</xsl:template>

<xsl:template match="comment()">
	<xsl:element name="div" namespace="{$xh}">
		<xsl:attribute name="style">
			<xsl:value-of select="'display:none'"/>
		</xsl:attribute>
		<xsl:copy-of select="."/>
	</xsl:element>
	<!-- <xsl:value-of select="." disable-output-escaping="yes" /> -->
</xsl:template>

</xsl:stylesheet>